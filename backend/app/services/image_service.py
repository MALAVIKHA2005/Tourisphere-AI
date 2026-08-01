import os
import time

import requests
from dotenv import load_dotenv

load_dotenv()

PEXELS_API_KEY = os.getenv("PEXELS_API_KEY")

FALLBACK_IMAGE = "https://images.unsplash.com/photo-1506744038136-46273834b3fb"

CACHE_TTL_SECONDS = 24 * 60 * 60  # images for a place rarely change
_image_cache = {}


def get_place_image(place_name, page=1):
    # `page` lets callers deliberately request Pexels' 2nd/3rd/etc result
    # instead of always the top one -- needed when two different real
    # places share a generic name (e.g. two separate "Geoglifo" sites in
    # the same state), which otherwise produces an identical search query
    # and therefore the exact same cached photo for both.
    cache_key = f"{(place_name or '').strip().lower()}|{page}"

    cached = _image_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["image"]

    image = _fetch_place_image(place_name, page)

    _image_cache[cache_key] = {
        "image": image,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return image


def _fetch_place_image(place_name, page=1):
    if not PEXELS_API_KEY:
        return FALLBACK_IMAGE

    try:
        headers = {"Authorization": PEXELS_API_KEY}

        url = (
            "https://api.pexels.com/v1/search"
            f"?query={place_name}"
            "&per_page=1"
            f"&page={page}"
        )

        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code != 200:
            print("Pexels API Error:", response.status_code)
            return FALLBACK_IMAGE

        data = response.json()

        if "photos" in data and len(data["photos"]) > 0:
            return data["photos"][0]["src"]["large"]

        return FALLBACK_IMAGE

    except Exception as e:
        print("Image error:", e)
        return FALLBACK_IMAGE
