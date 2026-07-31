import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60
_cache = {}


def search_countries(query):
    cache_key = (query or "").strip().lower()

    if not cache_key:
        return []

    cached = _cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_countries(query)

    _cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result


def _fetch_countries(query):
    if not API_KEY:
        return []

    try:
        response = requests.get(
            "https://api.geoapify.com/v1/geocode/autocomplete",
            params={
                "text": query,
                "type": "country",
                "limit": 10,
                "apiKey": API_KEY,
            },
            timeout=8,
        )

        if response.status_code != 200:
            return []

        features = response.json().get("features", [])

        countries = []

        for feature in features:
            properties = feature.get("properties", {})
            name = properties.get("name")
            country_code = properties.get("country_code")

            # Filters out non-country matches Geoapify sometimes includes
            # (e.g. "United Nations" has no country_code).
            if name and country_code:
                countries.append({"name": name, "country_code": country_code})

        return countries

    except Exception as e:
        print("Country Search Error:", e)
        return []
