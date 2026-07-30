import os
import time
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv

load_dotenv()

AMADEUS_API_KEY = os.getenv("AMADEUS_API_KEY")
AMADEUS_API_SECRET = os.getenv("AMADEUS_API_SECRET")

AMADEUS_BASE_URL = "https://test.api.amadeus.com"

CACHE_TTL_SECONDS = 3600

_token_cache = {"access_token": None, "expires_at": 0}
_price_cache = {}


def _get_access_token():
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        return None

    if (
        _token_cache["access_token"]
        and _token_cache["expires_at"] > time.time()
    ):
        return _token_cache["access_token"]

    try:
        response = requests.post(
            f"{AMADEUS_BASE_URL}/v1/security/oauth2/token",
            data={
                "grant_type": "client_credentials",
                "client_id": AMADEUS_API_KEY,
                "client_secret": AMADEUS_API_SECRET,
            },
            timeout=10,
        )

        if response.status_code != 200:
            print("Amadeus Auth Error:", response.status_code, response.text)
            return None

        data = response.json()

        _token_cache["access_token"] = data["access_token"]
        _token_cache["expires_at"] = time.time() + data.get("expires_in", 1800) - 60

        return _token_cache["access_token"]

    except Exception as e:
        print("Amadeus Auth Error:", e)
        return None


def _resolve_city_code(city, token):
    try:
        response = requests.get(
            f"{AMADEUS_BASE_URL}/v1/reference-data/locations/cities",
            headers={"Authorization": f"Bearer {token}"},
            params={"keyword": city, "max": 1},
            timeout=10,
        )

        if response.status_code != 200:
            print("Amadeus City Search Error:", response.status_code, response.text)
            return None

        data = response.json().get("data", [])

        if not data:
            return None

        return data[0].get("iataCode")

    except Exception as e:
        print("Amadeus City Search Error:", e)
        return None


def _search_hotel_offers(city_code, token):
    try:
        check_in = (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d")
        check_out = (datetime.now(timezone.utc) + timedelta(days=31)).strftime("%Y-%m-%d")

        response = requests.get(
            f"{AMADEUS_BASE_URL}/v3/shopping/hotel-offers",
            headers={"Authorization": f"Bearer {token}"},
            params={
                "cityCode": city_code,
                "checkInDate": check_in,
                "checkOutDate": check_out,
                "adults": 1,
                "roomQuantity": 1,
                "currency": "USD",
                "bestRateOnly": "true",
            },
            timeout=15,
        )

        if response.status_code != 200:
            print("Amadeus Hotel Offers Error:", response.status_code, response.text)
            return []

        return response.json().get("data", [])

    except Exception as e:
        print("Amadeus Hotel Offers Error:", e)
        return []


def get_average_hotel_price(city, country):
    """
    Returns {"available": True, "average_price": float, "currency": "USD",
    "sample_size": int} for a real live average nightly hotel price, or
    {"available": False} if Amadeus isn't configured or has no sandbox data
    for this destination.
    """

    cache_key = f"{(city or '').lower()}|{(country or '').lower()}"
    cached = _price_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = {"available": False}

    token = _get_access_token()

    if token and city:
        city_code = _resolve_city_code(city, token)

        if city_code:
            offers = _search_hotel_offers(city_code, token)

            prices = []

            for hotel_offer in offers:
                try:
                    price = float(hotel_offer["offers"][0]["price"]["total"])
                    prices.append(price)
                except (KeyError, IndexError, ValueError, TypeError):
                    continue

            if prices:
                result = {
                    "available": True,
                    "average_price": round(sum(prices) / len(prices), 2),
                    "currency": "USD",
                    "sample_size": len(prices),
                }

    _price_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result
