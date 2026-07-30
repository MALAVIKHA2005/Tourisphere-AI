import time

import requests

FALLBACK_RATES = {"INR": 1, "USD": 0.012, "EUR": 0.011, "GBP": 0.0095, "JPY": 1.8}

CACHE_TTL_SECONDS = 60 * 60
_cache = {"rates": None, "expires_at": 0}


def get_exchange_rates():
    if _cache["rates"] and _cache["expires_at"] > time.time():
        return _cache["rates"]

    rates = _fetch_exchange_rates()

    _cache["rates"] = rates
    _cache["expires_at"] = time.time() + CACHE_TTL_SECONDS

    return rates


def _fetch_exchange_rates():
    try:
        response = requests.get(
            "https://open.er-api.com/v6/latest/INR", timeout=8
        )
        data = response.json()

        return {
            "INR": 1,
            "USD": data["rates"]["USD"],
            "EUR": data["rates"]["EUR"],
            "GBP": data["rates"]["GBP"],
            "JPY": data["rates"]["JPY"],
        }

    except Exception as e:
        print("Currency API Error:", e)
        return FALLBACK_RATES
