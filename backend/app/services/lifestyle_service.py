import os
import time
from concurrent.futures import ThreadPoolExecutor

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60
_lifestyle_cache = {}

SAMPLE_SIZE = 8

# Verified against Geoapify directly before building this -- these
# category strings return real results (Bangkok test: shopping 5,
# nightlife 5, entertainment 5, culture 5). "entertainment.nightclub" and
# "catering.nightclub" both returned 0 and were dropped in favor of the
# bar/pub categories, which do have real data. "family" (parks/
# playgrounds/zoos/aquariums, verified near Ooty) backs the Family Score
# replacement on the destination card -- a real nearby-places count
# instead of a fabricated 0-100 score.
CATEGORY_GROUPS = {
    "shopping": "commercial.shopping_mall,commercial.marketplace",
    "nightlife": "catering.bar,catering.pub",
    "entertainment": "entertainment.cinema,entertainment.theme_park",
    "culture": "entertainment.museum,entertainment.culture.theatre",
    "family": "leisure.park,leisure.playground,entertainment.zoo,entertainment.aquarium",
}


def get_lifestyle(city, country):
    cache_key = f"{(city or '').strip().lower()}|{(country or '').strip().lower()}"
    cached = _lifestyle_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_lifestyle(city, country)

    _lifestyle_cache[cache_key] = {
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
        print("Lifestyle Geocode Error:", e)
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
        print("Lifestyle Fetch Error:", e)
        return []


def _fetch_lifestyle(city, country):
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


RELIGION_CATEGORIES = "religion.place_of_worship"
_worship_cache = {}


def get_places_of_worship(city, country):
    """
    Real temples/churches/mosques/shrines near a city -- kept separate
    from the regular Lifestyle tabs (not every trip wants them front and
    center), used by the AI Trip Planner when a traveler's interests
    mention them. Verified real category: a Coimbatore test returned
    real named temples (Koniamaan temple, New Sowdeshwari Amman Temple).
    """

    cache_key = f"worship|{(city or '').strip().lower()}|{(country or '').strip().lower()}"
    cached = _worship_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["places"]

    if not API_KEY or not city:
        places = []
    else:
        place_id = _geocode_place_id(city, country)
        places = _fetch_category(place_id, RELIGION_CATEGORIES) if place_id else []

    _worship_cache[cache_key] = {
        "places": places,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return places
