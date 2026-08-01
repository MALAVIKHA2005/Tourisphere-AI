import os
import re
import time

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEOAPIFY_API_KEY")

CACHE_TTL_SECONDS = 60 * 60
_route_cache = {}

# A widely-used ballpark for combined fuel + wear-and-tear cost per km --
# NOT a real fare or a country-specific fuel price lookup. Flights/trains/
# buses have no honest free data source (same dead-end as Amadeus), so
# this only covers road trips, and is clearly labeled as a rough estimate
# rather than presented as a real price.
COST_PER_KM_USD = 0.12

COORD_PATTERN = re.compile(r"^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$")


def _resolve_point(value):
    """Accepts either a "lat,lon" string or a free-text place name and
    returns (lat, lon), geocoding the text case via Geoapify."""

    if not value:
        return None

    match = COORD_PATTERN.match(value)

    if match:
        return float(match.group(1)), float(match.group(3))

    try:
        geo_url = (
            "https://api.geoapify.com/v1/geocode/search"
            f"?text={value}"
            f"&apiKey={API_KEY}"
        )

        response = requests.get(geo_url, timeout=10)
        data = response.json()

        if "features" not in data or len(data["features"]) == 0:
            return None

        props = data["features"][0]["properties"]
        return props.get("lat"), props.get("lon")

    except Exception as e:
        print("Transport Geocode Error:", e)
        return None


def get_route(from_value, to_value, mode="drive"):
    """
    Returns real driving/cycling distance and travel time between two
    points (each a "lat,lon" string or a place name) via Geoapify Routing.
    No real fare data exists for flights/trains/buses without a paid API,
    so this only covers road trips, plus a clearly-labeled rough cost
    estimate -- not a live price.
    """

    cache_key = f"{(from_value or '').strip().lower()}|{(to_value or '').strip().lower()}|{mode}"
    cached = _route_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = {"available": False}

    if API_KEY and from_value and to_value:
        origin = _resolve_point(from_value)
        destination = _resolve_point(to_value)

        if origin and destination:
            try:
                waypoints = f"{origin[0]},{origin[1]}|{destination[0]},{destination[1]}"

                url = (
                    "https://api.geoapify.com/v1/routing"
                    f"?waypoints={waypoints}"
                    f"&mode={mode}"
                    f"&apiKey={API_KEY}"
                )

                response = requests.get(url, timeout=10)
                data = response.json()

                if data.get("features"):
                    props = data["features"][0]["properties"]
                    distance_km = round(props["distance"] / 1000, 1)
                    duration_minutes = round(props["time"] / 60)

                    result = {
                        "available": True,
                        "mode": mode,
                        "distance_km": distance_km,
                        "duration_minutes": duration_minutes,
                        "estimated_cost_usd": round(distance_km * COST_PER_KM_USD, 2),
                    }

                else:
                    # Walk (and to a lesser extent bicycle) routing has a
                    # real distance ceiling on Geoapify's API -- surfacing
                    # *why* it failed instead of a generic "no route" is
                    # the difference between this looking broken and
                    # looking correct (e.g. walking from Ooty to Goa,
                    # ~500km apart, SHOULD fail).
                    error_message = (data.get("message") or "").lower()

                    if "exceed" in error_message or "too long" in error_message:
                        if mode == "drive":
                            reason = "That's too far apart for a direct road route."
                        else:
                            reason = f"That's too far to {mode} directly -- try Drive instead."

                        result = {"available": False, "reason": reason}

            except Exception as e:
                print("Transport Route Error:", e)

    _route_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result
