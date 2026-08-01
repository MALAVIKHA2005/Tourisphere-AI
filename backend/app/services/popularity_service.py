import re
import time
from datetime import datetime, timedelta
from urllib.parse import quote

import requests

HEADERS = {"User-Agent": "TourisphereAI/1.0 (https://tourisphere-ai-maals.vercel.app)"}

# View counts barely move day to day, and Wikipedia's own pageview data
# lags by ~2 days anyway, so a long TTL avoids re-hitting their API for
# every single search.
CACHE_TTL_SECONDS = 60 * 60 * 24
_popularity_cache = {}

# Words too generic to prove two titles are about the same real place
# (e.g. "Center" or "Statue" appearing in both is a coincidence, not a
# match) -- used to sanity-check search-fallback results below.
GENERIC_WORDS = {
    "the", "of", "and", "center", "centre", "statue", "temple", "museum",
    "park", "lake", "fort", "palace", "hill", "view", "point", "garden",
    "house", "monument", "memorial", "road", "street", "national", "city",
}


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


def _significant_words(text):
    return {
        w for w in re.findall(r"[a-z]+", text.lower())
        if len(w) >= 4 and w not in GENERIC_WORDS
    }


def _resolve_wikipedia_title(place_name, city):
    # 1. Try the place name as a direct, exact article title first --
    # this is how most real destinations (Ooty, Munnar, Agra...) resolve.
    try:
        summary_url = (
            "https://en.wikipedia.org/api/rest_v1/page/summary/"
            f"{quote(place_name)}"
        )
        response = requests.get(summary_url, headers=HEADERS, timeout=6)

        if response.status_code == 200:
            data = response.json()
            if data.get("type") != "disambiguation":
                return data.get("title")

    except Exception as e:
        print("Popularity Wikipedia Summary Error:", e)

    # 2. Fall back to full-text search for less exact names (e.g. a
    # curated place named "Isha Yoga Center (Adiyogi Statue)" whose real
    # article is titled "Adiyogi Shiva bust"). Only trust the top result
    # if it shares a real, non-generic word with the place name -- avoids
    # confidently attaching an unrelated article's traffic to this place.
    try:
        query = f"{place_name} {city}" if city else place_name

        search_url = (
            "https://en.wikipedia.org/w/api.php"
            f"?action=query&list=search&srsearch={quote(query)}"
            "&format=json&srlimit=3"
        )
        response = requests.get(search_url, headers=HEADERS, timeout=6)
        data = response.json()

        query_words = _significant_words(place_name)

        for result in data.get("query", {}).get("search", []):
            title = result.get("title", "")
            if query_words & _significant_words(title):
                return title

    except Exception as e:
        print("Popularity Wikipedia Search Error:", e)

    return None


def _fetch_popularity(place_name, city):
    if not place_name:
        return None

    title = _resolve_wikipedia_title(place_name, city)

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
