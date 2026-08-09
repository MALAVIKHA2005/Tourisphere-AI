import os
import re
from concurrent.futures import ThreadPoolExecutor

from groq import Groq

from app.database.mongodb import destinations_collection
from app.services.climate_service import get_best_months
from app.services.hotel_price_service import get_budget_tier
from app.services.popularity_service import get_popularity
from app.services.reviews_service import get_reviews
from app.utils.identity import get_destination_key

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
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
    "not", "no", "yes", "if", "then", "than", "so", "as", "from", "by",
    "up", "out", "down", "into", "over", "me", "us", "him", "them",
    "tell", "give", "find", "show", "good", "some", "any", "there",
    "want", "like", "need", "looking", "trip", "travel", "place",
    "places", "destination", "destinations", "visit",
}

SYSTEM_PROMPT = (
    "You are Tourisphere's travel assistant. Answer the traveler's question "
    "using ONLY the real destination data given to you below -- never invent "
    "facts, prices, ratings, popularity numbers, or reviews that aren't "
    "explicitly present in it. If the provided data doesn't cover what's "
    "asked, say so honestly and mention what real data IS available instead "
    "of guessing. Keep answers concise and conversational."
)


def _tokenize(text):
    return {
        w for w in re.findall(r"[a-z]+", (text or "").lower())
        if len(w) >= 3 and w not in STOPWORDS
    }


def _destination_document(d):
    parts = [
        d.get("name"), d.get("country"), d.get("state"), d.get("city"),
        d.get("climate"),
        " ".join(d.get("interests") or []),
        " ".join(d.get("suitableFor") or []),
    ]
    return " ".join(p for p in parts if p)


def retrieve_relevant(question, top_k=4):
    """
    Real, transparent keyword-overlap retrieval over the curated
    catalogue's real fields -- not embeddings (would need a heavy model
    download, risky on a free-tier server) and not a trained classifier,
    just an honest word-overlap score, same spirit as the significant-word
    matching wikipedia_service.py already uses elsewhere in this codebase.
    """

    destinations = list(destinations_collection.find({}, {"_id": 0}))
    query_words = _tokenize(question)

    scored = []
    for d in destinations:
        overlap = query_words & _tokenize(_destination_document(d))
        if overlap:
            scored.append((len(overlap), d))

    scored.sort(key=lambda item: item[0], reverse=True)

    if scored:
        return [d for _, d in scored[:top_k]]

    # No keyword overlap at all (a vague/generic question) -- fall back to
    # the catalogue's real highest-rated places so the assistant still has
    # *some* real grounding, rather than an empty context.
    destinations.sort(key=lambda d: d.get("rating") or 0, reverse=True)
    return destinations[:top_k]


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


def _format_context(destinations):
    blocks = []

    for d in destinations:
        lines = [f"### {d.get('name')}, {d.get('state') or ''} {d.get('country')}".strip()]
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

    retrieved = retrieve_relevant(retrieval_query)

    with ThreadPoolExecutor(max_workers=4) as pool:
        enriched = list(pool.map(_enrich, retrieved))

    context = _format_context(enriched)

    messages = [
        {"role": "system", "content": f"{SYSTEM_PROMPT}\n\nREAL DESTINATION DATA:\n{context}"}
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

    return {"answer": answer, "sources": sources}
