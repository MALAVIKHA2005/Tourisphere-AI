import os
import re
from concurrent.futures import ThreadPoolExecutor

import requests
from groq import Groq

from app.database.mongodb import destinations_collection
from app.services.climate_service import get_best_months
from app.services.hotel_price_service import get_budget_tier
from app.services.popularity_service import get_popularity
from app.services.reviews_service import get_reviews
from app.utils.identity import get_destination_key

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY")
MODEL = "llama-3.3-70b-versatile"

_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# Generic enough that matching on them proves nothing about which
# destination a question is actually about -- same idea as
# wikipedia_service.py's GENERIC_WORDS, adapted for full sentences
# instead of place titles.
STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "to", "of", "in", "on", "at", "for", "and", "or", "but", "with",
    "about", "what", "which", "who", "whom", "this", "that", "these",
    "those", "i", "you", "he", "she", "it", "we", "they", "my", "your",
    "his", "her", "its", "our", "their", "do", "does", "did", "can",
    "could", "will", "would", "should", "shall", "may", "might", "must",
    "how", "when", "where", "why",
    "not", "no", "yes", "if", "then", "than", "so", "as", "from", "by",
    "up", "out", "down", "into", "over", "me", "us", "him", "them",
    "tell", "give", "find", "show", "good", "some", "any", "there",
    "want", "like", "need", "looking", "trip", "travel", "place",
    "places", "destination", "destinations", "visit",
    # Pure conversational filler -- has zero signal value even when it
    # coincidentally happens to also be a real, obscure place name (there
    # is a real tiny town literally called "Okay, Oklahoma"). Deliberately
    # does NOT include words like "cool" that are filler-ish but also a
    # real descriptive tag value (climate "Cool") retrieval scoring
    # depends on.
    "okay", "ok", "yes", "sure", "thanks", "thank", "please", "alright",
    "right", "fine", "great", "nice", "hmm",
}

# Words that show up constantly in travel questions but aren't candidate
# place names -- used only to narrow down what to try geocoding when the
# curated catalogue has no real match, not for the retrieval scoring above.
NON_PLACE_WORDS = STOPWORDS | {
    "suggestion", "suggestions", "suggest", "planned", "plan", "planning",
    "famous", "detail", "details", "well", "also", "here", "there",
    "nature", "hill", "station", "photography", "beach", "culture",
    "adventure", "luxury", "nightlife", "history", "family", "couple",
    "friends", "solo", "cool", "warm", "tropical", "budget", "cheap",
    "expensive", "climate", "weather", "review", "reviews", "rating",
    "popular", "popularity", "recommend", "recommendation", "recommendations",
}

TEMPLE_WORDS = {"temple", "temples", "church", "churches", "mosque", "mosques", "shrine", "shrines"}

# These are category signals (see _fetch_live_sights), not place-name
# candidates -- without excluding them, a question like "temple details
# in Madurai" tries geocoding "temple" first and finds a real town
# literally named Temple, Texas, winning over the actual place name.
NON_PLACE_WORDS = NON_PLACE_WORDS | TEMPLE_WORDS

# Deliberately excludes "amenity" -- that result type matches individual
# named venues (shops, cafes, monuments), not places, so a common English
# word that happens to coincidentally be a business's real name (e.g. a
# cafe literally named "Things") could win over the actual place name in
# the same question. Restricting to real geographic entities means a
# false-positive candidate is far more likely to simply fail to resolve
# and fall through to the next one, instead of confidently resolving to
# the wrong thing.
VALID_GEOCODE_RESULT_TYPES = {"city", "island", "region", "county", "state", "district"}

SYSTEM_PROMPT = (
    "You are Tourisphere's travel assistant. Answer the traveler's question "
    "using ONLY the real data given to you below -- never invent facts, "
    "prices, ratings, popularity numbers, or reviews that aren't explicitly "
    "present in it. The data below is a SUBSET retrieved specifically for "
    "this question out of a much larger real catalogue and live search -- "
    "it is not the entirety of what this platform knows, so never claim you "
    "'only have data on X' or that nothing else exists. If the provided data "
    "doesn't cover what's asked, say so honestly for THIS question and "
    "mention what real data IS available instead of guessing. Keep answers "
    "concise and conversational."
)


def _tokenize(text):
    return {
        w for w in re.findall(r"[a-z]+", (text or "").lower())
        if len(w) >= 3 and w not in STOPWORDS
    }


def _location_words(d):
    """Real identity of the place -- a match here means the question is
    actually about this destination, not just sharing a generic word."""
    parts = [d.get("name"), d.get("country"), d.get("state"), d.get("city")]
    return _tokenize(" ".join(p for p in parts if p))


def _descriptive_words(d):
    """Editorial tags shared across many destinations (e.g. "Adventure",
    "Cool") -- real, but too generic on their own to prove a question is
    about THIS specific destination rather than an uncovered one that
    happens to share the same vocabulary."""
    parts = [d.get("climate"), " ".join(d.get("interests") or []), " ".join(d.get("suitableFor") or [])]
    return _tokenize(" ".join(p for p in parts if p))


def _diversify_by_country(ranked_destinations, top_k, max_per_country=1):
    """
    Picks top_k from an already score-ranked list, capping how many can
    come from the same country on the first pass. Without this, a tie
    among many equally-valid matches (e.g. every "Cool" climate
    destination for a generic "cool places" question) silently favors
    whichever country happens to have the most curated entries -- 3 of
    India's 4 Cool destinations would fill every slot before Zurich,
    London or New York (also real Cool destinations) ever got a chance,
    making the catalogue's real global spread invisible. Backfills from
    the same ranked order (ignoring the cap) if diversifying alone
    doesn't reach top_k.
    """

    picked, seen = [], {}

    for d in ranked_destinations:
        country = (d.get("country") or "").lower()
        if seen.get(country, 0) >= max_per_country:
            continue
        picked.append(d)
        seen[country] = seen.get(country, 0) + 1
        if len(picked) >= top_k:
            return picked

    for d in ranked_destinations:
        if d not in picked:
            picked.append(d)
            if len(picked) >= top_k:
                break

    return picked


def retrieve_relevant(question, top_k=4):
    """
    Real, transparent keyword-overlap retrieval over the curated
    catalogue's real fields -- not embeddings (would need a heavy model
    download, risky on a free-tier server) and not a trained classifier,
    just an honest word-overlap score, same spirit as the significant-word
    matching wikipedia_service.py already uses elsewhere in this codebase.

    Returns (destinations, matched) -- matched is True only when the TOP
    result's overlap includes a real location word (name/city/state/
    country), not just shared descriptive vocabulary. A question about an
    uncovered real place (e.g. "Rishikesh for adventure sports") would
    otherwise coincidentally match several curated destinations tagged
    "Adventure" and wrongly skip the live-search fallback for Rishikesh
    itself -- location overlap is weighted far higher so a real place
    match always outranks generic shared tags.
    """

    destinations = list(destinations_collection.find({}, {"_id": 0}))
    query_words = _tokenize(question)

    scored = []
    for d in destinations:
        loc_overlap = query_words & _location_words(d)
        desc_overlap = query_words & _descriptive_words(d)
        total = len(loc_overlap) + len(desc_overlap)

        if total:
            weighted = len(loc_overlap) * 10 + len(desc_overlap)
            scored.append((weighted, bool(loc_overlap), d))

    scored.sort(key=lambda item: item[0], reverse=True)

    if scored:
        matched = scored[0][1]
        ranked = [d for _, _, d in scored]

        # A confident location match (a real place was actually named) is
        # returned in strict score order -- there's usually only one real
        # destination for a specific place anyway, so diversifying would
        # just be noise. A generic/descriptive match (no place named) is
        # exactly the case that needs diversifying, or ties silently
        # favor whichever country has the most curated entries.
        top = ranked[:top_k] if matched else _diversify_by_country(ranked, top_k)
        return top, matched

    # No keyword overlap at all -- fall back to the catalogue's real
    # highest-rated places so there's still *some* real grounding, spread
    # across countries rather than whichever happens to rate highest most often.
    destinations.sort(key=lambda d: d.get("rating") or 0, reverse=True)
    return _diversify_by_country(destinations, top_k), False


def _extract_place_candidates(question, max_candidates=3):
    """
    The curated catalogue only covers 23 destinations -- most real places
    someone asks about (e.g. "Coimbatore") won't be in it at all. Rather
    than pretend no data exists, pull out words that aren't generic travel
    vocabulary and try geocoding them for a real live lookup instead.
    """

    words = re.findall(r"[a-z]+", (question or "").lower())
    seen = []

    for w in words:
        if len(w) >= 3 and w not in NON_PLACE_WORDS and w not in seen:
            seen.append(w)

    return seen[:max_candidates]


def _resolve_live_place(question):
    if not GEOAPIFY_API_KEY:
        return None

    for candidate in _extract_place_candidates(question):
        try:
            response = requests.get(
                "https://api.geoapify.com/v1/geocode/search",
                params={"text": candidate, "apiKey": GEOAPIFY_API_KEY, "limit": 1},
                timeout=8,
            )
            features = (response.json() or {}).get("features") or []

            if not features:
                continue

            props = features[0]["properties"]

            if props.get("result_type") not in VALID_GEOCODE_RESULT_TYPES:
                continue

            # A common English word can still coincidentally BE a real,
            # obscure place ("How" is a real tiny town in Wisconsin) --
            # result_type alone doesn't catch that. Real tourist
            # destinations (even smaller ones -- Munnar scores ~0.44,
            # Ooty ~0.47) score well above coincidental word matches
            # ("how" ~0.32, "share" ~0.15, "project" ~0.19), so requiring
            # a minimum importance filters those out without needing an
            # ever-growing manual word list.
            importance = (props.get("rank") or {}).get("importance")
            if importance is None or importance < 0.35:
                continue

            return {
                "place_id": props.get("place_id"),
                "name": props.get("city") or props.get("name") or candidate.title(),
                "state": props.get("state"),
                "country": props.get("country"),
            }

        except Exception as e:
            print("RAG Geocode Error:", e)
            continue

    return None


def _fetch_live_sights(place_id, question):
    categories = "tourism.sights"

    if TEMPLE_WORDS & set(re.findall(r"[a-z]+", (question or "").lower())):
        categories += ",religion.place_of_worship"

    try:
        response = requests.get(
            "https://api.geoapify.com/v2/places",
            params={
                "categories": categories,
                "filter": f"place:{place_id}",
                "limit": 8,
                "apiKey": GEOAPIFY_API_KEY,
            },
            timeout=10,
        )

        names = []
        for feature in (response.json() or {}).get("features", []):
            name = feature["properties"].get("name")
            if name:
                names.append(name)

        return names

    except Exception as e:
        print("RAG Live Sights Error:", e)
        return []


def _enrich(d):
    name, city, country = d.get("name"), d.get("city"), d.get("country")

    d["popularity"] = get_popularity(name, city)
    d["bestMonths"] = get_best_months(city, country)
    d["budget"] = get_budget_tier(city or name, country)

    review_data = get_reviews(get_destination_key(d))
    d["reviewSummary"] = {
        "count": review_data["count"],
        "averageRating": review_data["averageRating"],
        "sample": [r["text"] for r in review_data["reviews"][:2]],
    }

    return d


def _location_header(d):
    bits = [d.get("name")]

    if d.get("city") and d.get("city") != d.get("name"):
        bits.append(d["city"])
    if d.get("state"):
        bits.append(d["state"])
    if d.get("country"):
        bits.append(d["country"])

    return "### " + ", ".join(b for b in bits if b)


def _format_context(destinations):
    blocks = []

    for d in destinations:
        lines = [_location_header(d)]
        lines.append(f"Climate: {d.get('climate') or 'No data'}")
        lines.append(f"Budget tier (live avg hotel price/night): {d.get('budget') or 'No data'}")
        lines.append(
            f"Best months to visit (real historical climate data): "
            f"{', '.join(d.get('bestMonths') or []) or 'No data'}"
        )
        lines.append(
            f"Popularity (real Wikipedia monthly page views): "
            f"{d['popularity'] if d.get('popularity') is not None else 'No data'}"
        )
        lines.append(f"Interests: {', '.join(d.get('interests') or []) or 'No data'}")
        lines.append(f"Suitable for: {', '.join(d.get('suitableFor') or []) or 'No data'}")
        lines.append(f"Curated rating: {d.get('rating') or 'No data'}")

        reviews = d.get("reviewSummary") or {}
        if reviews.get("count"):
            lines.append(
                f"Real traveler reviews: {reviews['count']} review(s), "
                f"average {reviews['averageRating']}/5"
            )
            for snippet in reviews.get("sample", []):
                lines.append(f'  - "{snippet}"')
        else:
            lines.append("Real traveler reviews: none yet")

        blocks.append("\n".join(lines))

    return "\n\n".join(blocks)


def _format_live_context(place, sights):
    bits = [place.get("name")]
    if place.get("state"):
        bits.append(place["state"])
    if place.get("country"):
        bits.append(place["country"])

    lines = ["### " + ", ".join(b for b in bits if b)]
    lines.append(
        "(Live-searched real place, not part of the curated catalogue -- "
        "so no climate/budget/popularity/review data exists for it here, "
        "only real nearby points of interest from a live search.)"
    )
    lines.append(
        "Real nearby points of interest (live search): "
        + (", ".join(sights) if sights else "none found")
    )

    return "\n".join(lines)


def ask(question, history=None):
    if not _client:
        return {
            "answer": "The AI assistant isn't configured yet -- no GROQ_API_KEY is set on the server.",
            "sources": [],
        }

    # A bare follow-up ("what about something cheaper instead?") shares no
    # keywords with any destination on its own -- folding in the last
    # couple of real user turns lets retrieval carry the actual topic
    # (e.g. "hill station") forward instead of losing it and falling back
    # to generic top-rated results.
    recent_user_turns = [
        t["content"] for t in (history or [])[-4:] if t.get("role") == "user"
    ]
    retrieval_query = " ".join(recent_user_turns + [question])

    retrieved, matched = retrieve_relevant(retrieval_query)

    # A category-specific ask (e.g. "temple details") can need a live
    # supplement even when the curated catalogue *did* match something
    # (e.g. Coimbatore matched via a destination's city field) -- the
    # single curated entry for that city doesn't mean it covers temples.
    question_words = set(re.findall(r"[a-z]+", (question or "").lower()))
    needs_live_supplement = (not matched) or bool(TEMPLE_WORDS & question_words)

    live_place = None
    live_sights = []

    if needs_live_supplement:
        live_place = _resolve_live_place(retrieval_query)
        if live_place and live_place.get("place_id"):
            live_sights = _fetch_live_sights(live_place["place_id"], question)

    # A real live match replaces the arbitrary top-rated curated fallback
    # entirely -- mixing in unrelated "top rated" destinations would just
    # confuse the answer once we have something actually relevant.
    curated_to_enrich = [] if (not matched and live_place) else retrieved

    with ThreadPoolExecutor(max_workers=4) as pool:
        enriched = list(pool.map(_enrich, curated_to_enrich)) if curated_to_enrich else []

    context_blocks = []
    if enriched:
        context_blocks.append(_format_context(enriched))
    if live_place:
        context_blocks.append(_format_live_context(live_place, live_sights))

    context = "\n\n".join(context_blocks) if context_blocks else "No relevant real data found for this question."

    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nREAL DATA:\n{context}"}
    ]

    for turn in (history or [])[-6:]:
        role, content = turn.get("role"), turn.get("content")
        if role in ("user", "assistant") and content:
            messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": question})

    try:
        response = _client.chat.completions.create(
            model=MODEL,
            messages=messages,
            max_tokens=500,
            temperature=0.4,
        )
        answer = response.choices[0].message.content
    except Exception as e:
        print("Groq Error:", e)
        answer = "Something went wrong reaching the assistant. Please try again."

    sources = [
        {"name": d.get("name"), "country": d.get("country"), "state": d.get("state")}
        for d in enriched
    ]
    if live_place:
        sources.append({
            "name": live_place.get("name"),
            "country": live_place.get("country"),
            "state": live_place.get("state"),
        })

    return {"answer": answer, "sources": sources}
