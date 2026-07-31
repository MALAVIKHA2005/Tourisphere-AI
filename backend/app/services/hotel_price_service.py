import os
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY")
RAPIDAPI_HOST = "xotelo-hotel-prices.p.rapidapi.com"
BASE_URL = f"https://{RAPIDAPI_HOST}/api"

HEADERS = {
    "x-rapidapi-host": RAPIDAPI_HOST,
    "x-rapidapi-key": RAPIDAPI_KEY,
}

# Sampling a handful of hotels per city keeps this within the free tier's
# 1,000 requests/month (1 search + up to HOTEL_SAMPLE_SIZE rate lookups per
# city, cached hard afterwards).
HOTEL_SAMPLE_SIZE = 3
CACHE_TTL_SECONDS = 24 * 60 * 60

_price_cache = {}


def _search_hotels(city, country):
    try:
        response = requests.get(
            f"{BASE_URL}/search",
            headers=HEADERS,
            params={"query": city, "location_type": "accommodation"},
            timeout=10,
        )

        if response.status_code != 200:
            return []

        data = response.json()

        if data.get("error"):
            return []

        results = (data.get("result") or {}).get("list") or []

        country_lower = (country or "").strip().lower()

        # Exact match only -- a substring check here previously matched
        # "India" against "Indiana" (US state), silently returning
        # Indianapolis hotel prices for an Indian destination. Wrong data
        # is worse than no data, so no unfiltered fallback either: if
        # nothing matches the country exactly, return nothing.
        matches = [
            item
            for item in results
            if country_lower and (item.get("country") or "").strip().lower() == country_lower
        ]

        return matches[:HOTEL_SAMPLE_SIZE]

    except Exception as e:
        print("Xotelo Search Error:", e)
        return []


def _get_rates(hotel_key, check_in, check_out):
    try:
        response = requests.get(
            f"{BASE_URL}/rates",
            headers=HEADERS,
            params={
                "hotel_key": hotel_key,
                "chk_in": check_in,
                "chk_out": check_out,
            },
            timeout=8,
        )

        if response.status_code != 200:
            return []

        data = response.json()

        if data.get("error"):
            return []

        rates = (data.get("result") or {}).get("rates") or []

        return [
            r["rate"]
            for r in rates
            if isinstance(r.get("rate"), (int, float))
        ]

    except Exception as e:
        print("Xotelo Rates Error:", e)
        return []


def get_average_hotel_price(city, country):
    """
    Returns {"available": True, "average_price": float, "currency": "USD",
    "sample_size": int} for a real live average nightly hotel price, or
    {"available": False} if the API isn't configured or has no data for
    this destination.
    """

    cache_key = f"{(city or '').lower()}|{(country or '').lower()}"
    cached = _price_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = {"available": False}

    if RAPIDAPI_KEY and city:
        hotels = _search_hotels(city, country)

        # Narrow landmark/attraction names (e.g. a specific memorial or
        # viewpoint) often don't match hotel-search indexes -- broaden to
        # the country so we still return a real (if less precise) price
        # instead of giving up entirely.
        if not hotels and country and country.lower() != city.lower():
            hotels = _search_hotels(country, country)

        if hotels:
            check_in = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
            check_out = (datetime.now(timezone.utc) + timedelta(days=31)).strftime("%Y-%m-%d")

            hotel_keys = [h.get("hotel_key") for h in hotels if h.get("hotel_key")]

            # Independent lookups -- run concurrently so the worst case is
            # one timeout, not HOTEL_SAMPLE_SIZE of them stacked in series.
            with ThreadPoolExecutor(max_workers=len(hotel_keys) or 1) as pool:
                rate_lists = pool.map(
                    lambda key: _get_rates(key, check_in, check_out), hotel_keys
                )

            all_rates = [rate for rates in rate_lists for rate in rates]

            if all_rates:
                result = {
                    "available": True,
                    "average_price": round(sum(all_rates) / len(all_rates), 2),
                    "currency": "USD",
                    "sample_size": len(all_rates),
                }

    _price_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result
