from collections import Counter

from app.database.mongodb import destinations_collection
from app.services.favorites_service import get_favorites
from app.services.history_service import get_travel_history
from app.utils.identity import get_destination_key

# Content-based similarity over real, already-stored attributes -- no
# training data, no model, no fabricated score. Weights are a documented
# heuristic (interests matter most, country least), not a claim of
# scientific precision.
INTEREST_WEIGHT = 0.40
SUITABLE_FOR_WEIGHT = 0.20
CLIMATE_WEIGHT = 0.15
BUDGET_WEIGHT = 0.15
COUNTRY_WEIGHT = 0.10

BUDGET_ORDER = {"Low": 0, "Medium": 1, "High": 2}


def _jaccard(set_a, set_b):
    if not set_a or not set_b:
        return 0.0

    union = set_a | set_b
    if not union:
        return 0.0

    return len(set_a & set_b) / len(union)


def _budget_closeness(budget_a, budget_b):
    if budget_a not in BUDGET_ORDER or budget_b not in BUDGET_ORDER:
        return 0.0

    return 1 - abs(BUDGET_ORDER[budget_a] - BUDGET_ORDER[budget_b]) / 2


def _exact_match(value_a, value_b):
    if not value_a or not value_b:
        return 0.0

    return 1.0 if value_a == value_b else 0.0


def similarity(dest_a, dest_b):
    interests_a = set(dest_a.get("interests") or [])
    interests_b = set(dest_b.get("interests") or [])

    suitable_a = set(dest_a.get("suitableFor") or [])
    suitable_b = set(dest_b.get("suitableFor") or [])

    return (
        _jaccard(interests_a, interests_b) * INTEREST_WEIGHT
        + _jaccard(suitable_a, suitable_b) * SUITABLE_FOR_WEIGHT
        + _exact_match(dest_a.get("climate"), dest_b.get("climate")) * CLIMATE_WEIGHT
        + _budget_closeness(dest_a.get("budget"), dest_b.get("budget")) * BUDGET_WEIGHT
        + _exact_match(dest_a.get("country"), dest_b.get("country")) * COUNTRY_WEIGHT
    )


def shared_reasons(dest_a, dest_b):
    """Human-readable reasons for a match -- so the UI can show *why*
    instead of just a bare percentage."""

    reasons = []

    shared_interests = set(dest_a.get("interests") or []) & set(dest_b.get("interests") or [])
    reasons.extend(sorted(shared_interests))

    if dest_a.get("climate") and dest_a.get("climate") == dest_b.get("climate"):
        reasons.append(f"{dest_b['climate']} climate")

    if dest_a.get("budget") and dest_a.get("budget") == dest_b.get("budget"):
        reasons.append(f"{dest_b['budget']} budget")

    return reasons[:3]


def get_similar_destinations(destination, limit=4):
    """
    "More Like This" -- content-based, no user data needed. Candidate
    pool is the curated catalogue only (the only destination set that's
    actually stored and queryable as a whole; dynamic/live-searched
    results aren't persisted anywhere to compare against).
    """

    candidates = list(destinations_collection.find({}, {"_id": 0}))
    target_key = get_destination_key(destination)

    scored = []

    for candidate in candidates:
        if get_destination_key(candidate) == target_key:
            continue

        score = similarity(destination, candidate)

        scored.append(
            {
                **candidate,
                "similarityScore": round(score * 100),
                "matchReasons": shared_reasons(destination, candidate),
            }
        )

    scored.sort(key=lambda item: item["similarityScore"], reverse=True)

    return scored[:limit]


def _build_profile(engaged_destinations):
    interest_counts = Counter()
    suitable_counts = Counter()
    climate_counts = Counter()
    budget_counts = Counter()
    country_counts = Counter()

    for d in engaged_destinations:
        interest_counts.update(d.get("interests") or [])
        suitable_counts.update(d.get("suitableFor") or [])

        if d.get("climate"):
            climate_counts[d["climate"]] += 1
        if d.get("budget"):
            budget_counts[d["budget"]] += 1
        if d.get("country"):
            country_counts[d["country"]] += 1

    return {
        # Top few, not everything ever engaged with -- an old one-off
        # interest shouldn't carry equal weight to a repeated pattern.
        "interests": [k for k, _ in interest_counts.most_common(5)],
        "suitableFor": [k for k, _ in suitable_counts.most_common(3)],
        "climate": climate_counts.most_common(1)[0][0] if climate_counts else None,
        "budget": budget_counts.most_common(1)[0][0] if budget_counts else None,
        "country": country_counts.most_common(1)[0][0] if country_counts else None,
    }


def _history_to_destination_shape(history_entry):
    """
    history_service.py stores a flattened, thinner record than favorites
    (name as a bare string under "destination", climate under "weather",
    no interests/suitableFor at all) -- reshape it to line up with the
    real destination dict shape the rest of this module expects, instead
    of silently losing/misreading its climate and identity.
    """

    return {
        "name": history_entry.get("destination"),
        "country": history_entry.get("country"),
        "state": history_entry.get("state"),
        "city": history_entry.get("city"),
        "climate": history_entry.get("weather"),
        "budget": history_entry.get("budget"),
        "rating": history_entry.get("rating"),
    }


def get_user_engagement(user_id):
    """Real favorites + travel history, reshaped to a common destination
    shape -- the raw material both recommendations and segmentation are
    built from."""

    favorites = get_favorites(user_id)
    history = get_travel_history(50, user_id)

    return [f["destination"] for f in favorites] + [
        _history_to_destination_shape(h) for h in history
    ]


def get_user_profile(user_id):
    """
    Real profile built from this user's real favorites + travel history,
    or None if they have no engagement yet -- shared by personalized
    recommendations and segmentation so both read the exact same real
    signal, not two slightly different ideas of "this user's taste."
    """

    engaged = get_user_engagement(user_id)

    if not engaged:
        return None

    return _build_profile(engaged)


def get_recommended_for_you(user_id, limit=8):
    """
    Personalized recommendations built from this user's *real* favorites
    and travel history -- not a generic fallback list. Returns empty if
    they have no engagement yet rather than faking a "popular" default.
    """

    engaged = get_user_engagement(user_id)

    if not engaged:
        return []

    profile = _build_profile(engaged)
    seen_keys = {get_destination_key(d) for d in engaged}

    candidates = list(destinations_collection.find({}, {"_id": 0}))

    scored = []

    for candidate in candidates:
        if get_destination_key(candidate) in seen_keys:
            continue

        score = similarity(profile, candidate)

        if score <= 0:
            continue

        scored.append(
            {
                **candidate,
                "similarityScore": round(score * 100),
                "matchReasons": shared_reasons(profile, candidate),
            }
        )

    scored.sort(key=lambda item: item["similarityScore"], reverse=True)

    return scored[:limit]
