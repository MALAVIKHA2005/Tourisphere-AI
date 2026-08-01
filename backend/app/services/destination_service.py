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
            "&limit=40"
            f"&apiKey={API_KEY}"
        )

        places_response = requests.get(
            places_url,
            timeout=10
        )

        places_data = places_response.json()

        places = []

        # Some real places share a generic name (e.g. two distinct
        # "Geoglifo" sites in the same state) -- without this, both build
        # the exact same Pexels query and land on the identical cached
        # photo. Tracking how many times a query has been used lets
        # repeats fall through to Pexels' 2nd/3rd result instead.
        query_occurrences = {}

        if "features" in places_data:

            for item in places_data["features"]:

                p = item["properties"]

                place_name = p.get("name", "Unknown")
                # Geoapify often omits "city" for landmarks in smaller or
                # remote areas (e.g. a monument in Ladakh) -- falling back
                # to the literal string "Unknown" broke downstream lookups
                # that use this as a real search query (hotel prices,
                # weather), since no API has a place called "Unknown".
                # Fall back to state, then country -- always a real,
                # searchable location.
                place_city = p.get("city") or p.get("state") or country

                # Searching by the place's own city (not the whole
                # country) gives Pexels a much more specific match --
                # searching "X, India" for every place in the country
                # tends to return the same generic/iconic photos repeated
                # across unrelated destinations.
                image_query = f"{place_name}, {place_city}"
                # Track case-insensitively -- image_service's own cache key
                # is lowercased, so "Geoglifo" and "geoglifo" resolve to
                # the same underlying Pexels query regardless of casing.
                dedup_key = image_query.strip().lower()
                occurrence = query_occurrences.get(dedup_key, 0)
                query_occurrences[dedup_key] = occurrence + 1

                image_url = get_place_image(image_query, page=occurrence + 1)

                destination = {

                    "name": place_name,

                    "city": place_city,

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

                    # No fabricated flat cost here -- the real live price
                    # (Xotelo-powered) is fetched on demand in the modal.
                    # A single hardcoded number was actively misleading:
                    # identical on every dynamic card regardless of place.
                    "averageCost": None,

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
