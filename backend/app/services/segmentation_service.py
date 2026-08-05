from app.services.recommendation_engine import get_user_profile, similarity, shared_reasons

# Rule-based classification, not a trained model -- there's nowhere
# near enough real users yet for clustering (k-means, etc.) to mean
# anything; with a handful of real people it would either return
# nothing meaningful or fit noise. Instead each user's real profile
# (built from their real favorites/history) is scored against a small
# set of named personas using the exact same similarity() formula the
# recommendation engine already uses -- transparent and reusable rather
# than a second, different notion of "similar."
#
# Every interest/climate/budget value below is drawn directly from the
# real vocabulary already used across the curated catalogue (seed_data.py)
# -- not invented categories.
SEGMENTS = [
    {
        "name": "Hill Station & Nature Explorer",
        "description": "Drawn to cool climates, mountains, and real nature/hill-station destinations.",
        "profile": {"interests": ["Nature", "Hill Station", "Photography"], "climate": "Cool", "budget": "Medium"},
    },
    {
        "name": "Beach & Adventure Seeker",
        "description": "Warm or tropical coastal destinations with an active, adventurous streak.",
        "profile": {"interests": ["Beach", "Adventure", "Nightlife"], "climate": "Tropical", "budget": "Medium"},
    },
    {
        "name": "Luxury Traveler",
        "description": "Prioritizes premium experiences -- high budget over cost-conscious travel.",
        "profile": {"interests": ["Luxury", "Culture", "Photography"], "climate": "Warm", "budget": "High"},
    },
    {
        "name": "Culture & Heritage Enthusiast",
        "description": "History, museums, and cultural landmarks over nature or nightlife.",
        "profile": {"interests": ["Culture", "History", "Photography"], "climate": "Warm", "budget": "Medium"},
    },
    {
        "name": "Budget Backpacker",
        "description": "Cost-conscious travel that prioritizes real experiences over comfort.",
        "profile": {"interests": ["Adventure", "Culture"], "climate": "Warm", "budget": "Low"},
    },
    {
        "name": "Nightlife & Social Traveler",
        "description": "Drawn to vibrant nightlife and social scenes at the destination.",
        "profile": {"interests": ["Nightlife", "Beach", "Adventure"], "climate": "Tropical", "budget": "Medium"},
    },
]


def get_user_segment(user_id):
    """
    Classifies a user into the closest-matching real persona based on
    their real engagement -- not a fabricated default. Returns None for
    users with no favorites/history yet (nothing honest to classify).
    """

    profile = get_user_profile(user_id)

    if profile is None:
        return None

    scored = [(similarity(profile, seg["profile"]), seg) for seg in SEGMENTS]
    scored.sort(key=lambda item: item[0], reverse=True)

    top_score, top_segment = scored[0]

    return {
        "segment": top_segment["name"],
        "description": top_segment["description"],
        "matchScore": round(top_score * 100),
        "matchReasons": shared_reasons(profile, top_segment["profile"]),
        "realSignals": {
            "topInterests": profile["interests"],
            "dominantClimate": profile["climate"],
            "dominantBudget": profile["budget"],
        },
    }
