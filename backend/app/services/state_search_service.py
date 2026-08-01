import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

# Administrative boundaries essentially never change -- cache generously.
CACHE_TTL_SECONDS = 24 * 60 * 60
_state_cache = {}


def get_states(country):
    cache_key = (country or "").strip().lower()

    if not cache_key:
        return []

    cached = _state_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["states"]

    states = _fetch_states(country)

    _state_cache[cache_key] = {
        "states": states,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return states


def _fetch_states(country):
    if not API_KEY:
        return []

    try:
        geo_url = (
            "https://api.geoapify.com/v1/geocode/search"
            f"?text={country}"
            f"&apiKey={API_KEY}"
        )

        geo_response = requests.get(geo_url, timeout=10)
        geo_data = geo_response.json()

        if not geo_data.get("features"):
            return []

        place_id = geo_data["features"][0]["properties"]["place_id"]

        # Real administrative divisions (states/provinces/territories) --
        # not just whatever happens to appear among a country's dynamic
        # destination results. Granularity varies by country (e.g. Brazil
        # returns its 5 macro-regions rather than 27 states) since that's
        # genuinely how Geoapify/OSM structure that country's first
        # administrative level below the country itself.
        boundaries_url = (
            "https://api.geoapify.com/v1/boundaries/consists-of"
            f"?id={place_id}"
            "&geometry=point"
            f"&apiKey={API_KEY}"
        )

        boundaries_response = requests.get(boundaries_url, timeout=10)
        boundaries_data = boundaries_response.json()

        names = sorted(
            {
                f["properties"]["name"]
                for f in boundaries_data.get("features", [])
                if f["properties"].get("name")
            }
        )

        return names

    except Exception as e:
        print("State Search Error:", e)
        return []
