import os
import time

import requests
from dotenv import load_dotenv

from app.services.image_service import get_place_image

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60  # dynamic places for a country don't change hour to hour
_places_cache = {}


def get_places(country):
    cache_key = (country or "").strip().lower()

    cached = _places_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["places"]

    places = _fetch_places(country)

    _places_cache[cache_key] = {
        "places": places,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return places


def _fetch_places(country):
    if not API_KEY:
        return []

    try:

        # -----------------------------
        # STEP 1 : Get Country Coordinates
        # -----------------------------
        geo_url = (
            "https://api.geoapify.com/v1/geocode/search"
            f"?text={country}"
            f"&apiKey={API_KEY}"
        )

        geo_response = requests.get(
            geo_url,
            timeout=10
        )

        geo_data = geo_response.json()

        if (
            "features" not in geo_data
            or len(geo_data["features"]) == 0
        ):
            return []

        properties = geo_data["features"][0]["properties"]

        place_id = properties["place_id"]

        # -----------------------------
        # STEP 2 : Fetch Tourist Places
        # -----------------------------
        places_url = (
            "https://api.geoapify.com/v2/places"
            "?categories=tourism.sights"
            f"&filter=place:{place_id}"
            "&limit=15"
            f"&apiKey={API_KEY}"
        )

        places_response = requests.get(
            places_url,
            timeout=10
        )

        places_data = places_response.json()

        places = []

        if "features" in places_data:

            for item in places_data["features"]:

                p = item["properties"]

                place_name = p.get("name", "Unknown")

                image_url = get_place_image(
                    f"{place_name} tourist attraction {country}"
                )

                destination = {

                    "name": place_name,

                    "city": p.get("city", "Unknown"),

                    "country": p.get("country", country),

                    "state": p.get("state", ""),

                    "latitude": p.get("lat"),

                    "longitude": p.get("lon"),

                    "image": image_url,

                    # Temporary values
                    "temperature": 25,

                    "humidity": 70,

                    "climate": "Clear",

                    "rating": 4.5,

                    "budget": "Medium",

                    "popularity": 90,

                    "averageCost": 1000,

                    "interests": [
                        "Culture",
                        "Nature"
                    ],

                    "bestMonths": [
                        "October",
                        "November",
                        "December"
                    ],

                    "suitableFor": [
                        "Solo",
                        "Couple",
                        "Family"
                    ]
                }

                places.append(destination)

        print(f"Dynamic Places Found: {len(places)}")

        return places

    except Exception as e:

        print("Destination Service Error:", e)

        return []
