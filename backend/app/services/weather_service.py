import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")

FALLBACK_WEATHER = {"temperature": None, "humidity": None, "condition": "Unknown"}

CACHE_TTL_SECONDS = 10 * 60
_weather_cache = {}


def get_weather(lat, lon):
    if not API_KEY:
        return {**FALLBACK_WEATHER, "wind_speed": None}

    try:

        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?lat={lat}"
            f"&lon={lon}"
            f"&appid={API_KEY}"
            "&units=metric"
        )

        response = requests.get(url, timeout=8)

        data = response.json()

        return {
            "temperature": data["main"]["temp"],
            "humidity": data["main"]["humidity"],
            "condition": data["weather"][0]["main"],
            "wind_speed": data["wind"]["speed"]
        }

    except Exception as e:

        print("Weather Error:", e)

        return {**FALLBACK_WEATHER, "wind_speed": None}


def get_weather_by_city(city):
    cache_key = (city or "").strip().lower()

    cached = _weather_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_weather_by_city(city)

    _weather_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result


def _fetch_weather_by_city(city):
    if not API_KEY:
        return FALLBACK_WEATHER

    try:
        url = (
            "https://api.openweathermap.org/data/2.5/weather"
            f"?q={city}"
            f"&appid={API_KEY}"
            "&units=metric"
        )

        response = requests.get(url, timeout=8)

        data = response.json()

        return {
            "temperature": data["main"]["temp"],
            "condition": data["weather"][0]["main"],
            "humidity": data["main"]["humidity"],
        }

    except Exception as e:
        print("Weather Error:", e)
        return FALLBACK_WEATHER
