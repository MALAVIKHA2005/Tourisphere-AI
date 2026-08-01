import os
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60
_lifestyle_cache = {}

SAMPLE_SIZE = 8

# Verified against Geoapify directly before building this -- these
# category strings return real results (Bangkok test: shopping 5,
# nightlife 5, entertainment 5, culture 5). "entertainment.nightclub" and
# "catering.nightclub" both returned 0 and were dropped in favor of the
# bar/pub categories, which do have real data.
CATEGORY_GROUPS = {
    "shopping": "commercial.shopping_mall,commercial.marketplace",
    "nightlife": "catering.bar,catering.pub",
    "entertainment": "entertainment.cinema,entertainment.theme_park",
    "culture": "entertainment.museum,entertainment.culture.theatre",
}


def get_lifestyle(city, country):
    cache_key = f"{(city or '').strip().lower()}|{(country or '').strip().lower()}"
    cached = _lifestyle_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_lifestyle(city, country)

    _lifestyle_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result


def _empty_result():
    return {group: [] for group in CATEGORY_GROUPS}


def _geocode_place_id(city, country):
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

        return data["features"][0]["properties"].get("place_id")

    except Exception as e:
        print("Lifestyle Geocode Error:", e)
        return None


def _fetch_category(place_id, categories):
    try:
        url = (
            "https://api.geoapify.com/v2/places"
            f"?categories={categories}"
            f"&filter=place:{place_id}"
            f"&limit={SAMPLE_SIZE}"
            f"&apiKey={API_KEY}"
        )

        response = requests.get(url, timeout=10)
        data = response.json()

        places = []

        for item in data.get("features", []):
            p = item["properties"]

            places.append(
                {
                    "name": p.get("name", "Unknown"),
                    "address": p.get("formatted") or p.get("address_line2") or "",
                    "latitude": p.get("lat"),
                    "longitude": p.get("lon"),
                }
            )

        return places

    except Exception as e:
        print("Lifestyle Fetch Error:", e)
        return []


def _fetch_lifestyle(city, country):
    if not API_KEY or not city:
        return _empty_result()

    place_id = _geocode_place_id(city, country)

    if not place_id:
        return _empty_result()

    with ThreadPoolExecutor(max_workers=len(CATEGORY_GROUPS)) as pool:
        results = pool.map(
            lambda item: (item[0], _fetch_category(place_id, item[1])),
            CATEGORY_GROUPS.items(),
        )

    return dict(results)
