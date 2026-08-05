import os
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60
_essential_services_cache = {}

SAMPLE_SIZE = 8

# Verified against Geoapify directly before building this (Ooty test:
# healthcare 10, supermarket 9, banking 8+7, transport 3+8). No
# "real_estate.agency" category exists on Geoapify at all (400 error) --
# housing/rent data has no honest free source, so it's skipped rather
# than faked, same as Cost of Living / Job Market for this phase.
CATEGORY_GROUPS = {
    "healthcare": "healthcare.hospital,healthcare.clinic_or_praxis,healthcare.pharmacy",
    "supermarket": "commercial.supermarket",
    "banking": "service.financial.bank,service.financial.atm",
    "transport": "public_transport.bus,public_transport.train",
}


def get_essential_services(city, country):
    cache_key = f"{(city or '').strip().lower()}|{(country or '').strip().lower()}"
    cached = _essential_services_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_essential_services(city, country)

    _essential_services_cache[cache_key] = {
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
        print("Essential Services Geocode Error:", e)
        return None


def _fetch_category(place_id, categories):
    try:
        # Over-fetch because some OSM points have no name tag at all --
        # those get filtered out below, so asking for exactly
        # SAMPLE_SIZE would leave the list short.
        url = (
            "https://api.geoapify.com/v2/places"
            f"?categories={categories}"
            f"&filter=place:{place_id}"
            f"&limit={SAMPLE_SIZE * 2}"
            f"&apiKey={API_KEY}"
        )

        response = requests.get(url, timeout=10)
        data = response.json()

        places = []

        for item in data.get("features", []):
            p = item["properties"]
            name = p.get("name")

            # Some OSM points have no name tag at all -- real place, just
            # not one we can show or identify, so skip it rather than
            # display a literal "Unknown".
            if not name:
                continue

            places.append(
                {
                    "name": name,
                    "address": p.get("formatted") or p.get("address_line2") or "",
                    "latitude": p.get("lat"),
                    "longitude": p.get("lon"),
                }
            )

            if len(places) >= SAMPLE_SIZE:
                break

        return places

    except Exception as e:
        print("Essential Services Fetch Error:", e)
        return []


def _fetch_essential_services(city, country):
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
