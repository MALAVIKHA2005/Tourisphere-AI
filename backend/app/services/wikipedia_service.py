import re
from urllib.parse import quote

import requests

HEADERS = {"User-Agent": "TourisphereAI/1.0 (https://tourisphere-ai-maals.vercel.app)"}

# Words too generic to prove two titles are about the same real place
# (e.g. "Center" or "Statue" appearing in both is a coincidence, not a
# match) -- used to sanity-check search-fallback results below.
GENERIC_WORDS = {
    "the", "of", "and", "center", "centre", "statue", "temple", "museum",
    "park", "lake", "fort", "palace", "hill", "view", "point", "garden",
    "house", "monument", "memorial", "road", "street", "national", "city",
}


def _significant_words(text):
    return {
        w for w in re.findall(r"[a-z]+", text.lower())
        if len(w) >= 4 and w not in GENERIC_WORDS
    }


def resolve_wikipedia_title(place_name, city=None):
    """
    Finds the real Wikipedia article for a place, or None if it can't be
    confidently matched -- shared by popularity_service.py (30-day view
    count) and forecast_service.py (multi-year trend), so both hit the
    exact same, already-verified matching logic rather than drifting
    apart over time.
    """

    if not place_name:
        return None

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
        print("Wikipedia Summary Error:", e)

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
        print("Wikipedia Search Error:", e)

    return None
