import os
import time
from datetime import datetime
from collections import defaultdict

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

# Climate normals don't shift day to day -- a long TTL avoids re-hitting
# the archive API for every request.
CACHE_TTL_SECONDS = 60 * 60 * 24 * 7
_climate_cache = {}

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
]

# "Best Months" = real historical daily temperature/rainfall for this
# exact place (Open-Meteo's free archive, no key needed), scored by how
# close each month's average temperature is to a comfortable travel
# range and how dry it is relative to the rest of the year. Not a
# curator's guess and not a flat value repeated across every place.
IDEAL_TEMP_C = 23
TEMP_COMFORT_RANGE_C = 15  # score reaches 0 once average temp is this far from ideal
TOP_MONTH_COUNT = 4


def get_best_months(city, country=None, lat=None, lon=None):
    cache_key = f"{lat},{lon}" if lat and lon else f"{(city or '').strip().lower()}|{(country or '').strip().lower()}"

    if not cache_key.strip("|,"):
        return None

    cached = _climate_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_best_months(city, country, lat, lon)

    _climate_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result


def _geocode(city, country):
    try:
        geo_url = (
            "https://api.geoapify.com/v1/geocode/search"
            f"?text={city}, {country or ''}"
            f"&apiKey={API_KEY}"
        )

        response = requests.get(geo_url, timeout=10)
        data = response.json()

        if not data.get("features"):
            return None

        props = data["features"][0]["properties"]
        return props.get("lat"), props.get("lon")

    except Exception as e:
        print("Climate Geocode Error:", e)
        return None


def _fetch_best_months(city, country, lat, lon):
    if lat is None or lon is None:
        if not city or not API_KEY:
            return None

        coords = _geocode(city, country)
        if not coords:
            return None

        lat, lon = coords

    try:
        # Pool 3 full years of real daily data (one request covering the
        # whole span) rather than just the latest year -- a single year
        # is noisy weather, not climate (e.g. one unusually dry month
        # skews that year's ranking); averaging several years is closer
        # to an honest climate normal. Kept to 3 (not more) since this is
        # already the heaviest request in the app -- larger spans time
        # out too often under concurrent load.
        end_year = datetime.utcnow().year - 1  # most recent full calendar year
        start_year = end_year - 2

        url = (
            "https://archive-api.open-meteo.com/v1/archive"
            f"?latitude={lat}&longitude={lon}"
            f"&start_date={start_year}-01-01&end_date={end_year}-12-31"
            "&daily=temperature_2m_mean,precipitation_sum"
            "&timezone=auto"
        )

        # A much bigger payload than this codebase's other API calls,
        # and one retry on top -- occasionally slow to generate/transfer,
        # especially under concurrent load from many places at once.
        response = None
        for attempt in range(2):
            try:
                response = requests.get(url, timeout=15)
                break
            except requests.exceptions.RequestException:
                if attempt == 1:
                    raise

        if response.status_code != 200:
            return None

        data = response.json().get("daily", {})
        dates = data.get("time", [])
        temps = data.get("temperature_2m_mean", [])
        precip = data.get("precipitation_sum", [])

        if not dates:
            return None

        monthly_temps = defaultdict(list)
        monthly_precip = defaultdict(list)

        for date_str, temp, rain in zip(dates, temps, precip):
            month = int(date_str.split("-")[1])
            if temp is not None:
                monthly_temps[month].append(temp)
            if rain is not None:
                monthly_precip[month].append(rain)

        if len(monthly_temps) < 12:
            return None  # incomplete year of data -- don't score off partial coverage

        avg_temp = {m: sum(v) / len(v) for m, v in monthly_temps.items()}
        avg_precip = {m: sum(v) / len(v) for m, v in monthly_precip.items()}
        max_precip = max(avg_precip.values()) or 1

        def score(month):
            temp_score = max(0, 1 - abs(avg_temp[month] - IDEAL_TEMP_C) / TEMP_COMFORT_RANGE_C)
            dryness_score = 1 - (avg_precip[month] / max_precip)
            return temp_score * 0.65 + dryness_score * 0.35

        top_months = sorted(range(1, 13), key=score, reverse=True)[:TOP_MONTH_COUNT]

        return [MONTH_NAMES[m - 1] for m in sorted(top_months)]

    except Exception as e:
        print("Climate Service Error:", e)
        return None
