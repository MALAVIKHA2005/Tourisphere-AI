import time
from datetime import datetime, timedelta
from urllib.parse import quote

import requests

from app.services.wikipedia_service import HEADERS, resolve_wikipedia_title

# View counts barely move day to day, and Wikipedia's own pageview data
# lags by ~2 days anyway, so a long TTL avoids re-hitting their API for
# every single search.
CACHE_TTL_SECONDS = 60 * 60 * 24
_popularity_cache = {}


def get_popularity(place_name, city=None):
    """
    Real popularity signal: total Wikipedia page views over the last 30
    days for the place's own article. Returns an int, or None if the
    place has no findable, confidently-matched Wikipedia article --
    never a fabricated score.
    """

    cache_key = (place_name or "").strip().lower()

    if not cache_key:
        return None

    cached = _popularity_cache.get(cache_key)

    if cached and cached["expires_at"] > time.time():
        return cached["result"]

    result = _fetch_popularity(place_name, city)

    _popularity_cache[cache_key] = {
        "result": result,
        "expires_at": time.time() + CACHE_TTL_SECONDS,
    }

    return result


def _fetch_popularity(place_name, city):
    if not place_name:
        return None

    title = resolve_wikipedia_title(place_name, city)

    if not title:
        return None

    try:
        end = datetime.utcnow() - timedelta(days=2)  # Wikipedia's pageview data lags ~2 days
        start = end - timedelta(days=30)

        wiki_title = quote(title.replace(" ", "_"), safe="_()")

        views_url = (
            "https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/"
            f"en.wikipedia/all-access/all-agents/{wiki_title}/daily/"
            f"{start.strftime('%Y%m%d00')}/{end.strftime('%Y%m%d00')}"
        )

        response = requests.get(views_url, headers=HEADERS, timeout=6)

        if response.status_code != 200:
            return None

        data = response.json()
        return sum(item.get("views", 0) for item in data.get("items", []))

    except Exception as e:
        print("Popularity Pageviews Error:", e)
        return None
