from app.database.mongodb import (
    travel_history_collection,
    search_history_collection,
    favorites_collection,
)


def _top_of(counts: dict):
    if not counts:
        return None

    return max(counts.items(), key=lambda item: item[1])[0]


def _count_field(records: list, field: str) -> dict:
    counts = {}

    for record in records:
        value = record.get(field)

        if not value:
            continue

        counts[value] = counts.get(value, 0) + 1

    return counts


def get_dashboard(user_id: str):

    history = list(
        travel_history_collection.find({"user_id": user_id}, {"_id": 0})
    )

    searches = list(
        search_history_collection.find({"user_id": user_id}, {"_id": 0})
    )

    favorites_count = favorites_collection.count_documents({"user_id": user_id})

    destination_views = _count_field(history, "destination")

    budget_breakdown = _count_field(searches, "budget")
    climate_breakdown = _count_field(searches, "climate")
    interest_breakdown = _count_field(searches, "interest")
    travel_type_breakdown = _count_field(searches, "travel_type")

    return {
        "totals": {
            "views": len(history),
            "searches": len(searches),
            "favorites": favorites_count,
        },
        "top_destination": _top_of(destination_views),
        "destination_views": destination_views,
        "top_budget": _top_of(budget_breakdown),
        "top_climate": _top_of(climate_breakdown),
        "top_interest": _top_of(interest_breakdown),
        "top_travel_type": _top_of(travel_type_breakdown),
        "budget_breakdown": budget_breakdown,
        "climate_breakdown": climate_breakdown,
        "interest_breakdown": interest_breakdown,
        "travel_type_breakdown": travel_type_breakdown,
    }


def get_dataset(user_id: str, limit: int):
    """
    Flat, timestamped export of a user's behaviour across history, searches
    and favorites — the "Analytics Dataset for AI" deliverable that later
    phases (recommendation engine, forecasting) can train against.
    """

    rows = []

    for record in travel_history_collection.find({"user_id": user_id}, {"_id": 0}):
        rows.append({
            "type": "view",
            "timestamp": record.get("viewed_at"),
            "destination": record.get("destination"),
            "country": record.get("country"),
            "budget": record.get("budget"),
            "climate": record.get("weather"),
        })

    for record in search_history_collection.find({"user_id": user_id}, {"_id": 0}):
        rows.append({
            "type": "search",
            "timestamp": record.get("searched_at"),
            "country": record.get("country"),
            "budget": record.get("budget"),
            "climate": record.get("climate"),
            "interest": record.get("interest"),
            "travel_type": record.get("travel_type"),
            "result_count": record.get("result_count"),
        })

    for record in favorites_collection.find({"user_id": user_id}, {"_id": 0}):
        destination = record.get("destination", {})
        rows.append({
            "type": "favorite",
            "timestamp": record.get("added_at"),
            "destination": destination.get("name"),
            "country": destination.get("country"),
            "budget": destination.get("budget"),
        })

    rows.sort(key=lambda row: row.get("timestamp") or 0, reverse=True)

    return rows[:limit]
