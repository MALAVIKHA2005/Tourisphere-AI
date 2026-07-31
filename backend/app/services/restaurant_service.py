import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60  # restaurants near a place don't change hour to hour
_restaurant_cache = {}

RESTAURANT_SAMPLE_SIZE = 12


def get_restaurants(city, country):
    cache_key = f"{(city or '').strip().lower()}|{(country or '').strip().lower()}"

    cached = _restaurant_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["restaurants"]

    restaurants = _fetch_restaurants(city, country)

    _restaurant_cache[cache_key] = {
        "restaurants": restaurants,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return restaurants


def _fetch_restaurants(city, country):
    if not API_KEY or not city:
        return []

    try:
        # -----------------------------
        # STEP 1 : Resolve the place (city, landmark, etc.) to a location
        # -----------------------------
        geo_url = (
            "https://api.geoapify.com/v1/geocode/search"
            f"?text={city}, {country or ''}"
            f"&apiKey={API_KEY}"
        )

        geo_response = requests.get(geo_url, timeout=10)
        geo_data = geo_response.json()

        if "features" not in geo_data or len(geo_data["features"]) == 0:
            return []

        properties = geo_data["features"][0]["properties"]
        place_id = properties.get("place_id")
        lat = properties.get("lat")
        lon = properties.get("lon")

        if place_id:
            location_filter = f"place:{place_id}"
        elif lat is not None and lon is not None:
            # 10km radius fallback when Geoapify can't resolve a boundary
            location_filter = f"circle:{lon},{lat},10000"
        else:
            return []

        # -----------------------------
        # STEP 2 : Fetch nearby restaurants
        # -----------------------------
        places_url = (
            "https://api.geoapify.com/v2/places"
            "?categories=catering.restaurant"
            f"&filter={location_filter}"
            f"&limit={RESTAURANT_SAMPLE_SIZE}"
            f"&apiKey={API_KEY}"
        )

        places_response = requests.get(places_url, timeout=10)
        places_data = places_response.json()

        restaurants = []

        if "features" in places_data:
            for item in places_data["features"]:
                p = item["properties"]

                cuisine = "Restaurant"
                for category in p.get("categories", []):
                    if category.startswith("catering.restaurant."):
                        cuisine = category.split(".")[-1].replace("_", " ").title()
                        break

                restaurants.append(
                    {
                        "name": p.get("name", "Unknown"),
                        "cuisine": cuisine,
                        "address": p.get("formatted") or p.get("address_line2") or "",
                        "latitude": p.get("lat"),
                        "longitude": p.get("lon"),
                    }
                )

        return restaurants

    except Exception as e:
        print("Restaurant Service Error:", e)
        return []
