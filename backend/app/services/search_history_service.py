from datetime import datetime, timezone
from app.database.mongodb import search_history_collection


def save_search(search: dict, user_id: str):

    record = {
        "user_id": user_id,
        "country": search.get("country"),
        "state": search.get("state"),
        "budget": search.get("budget"),
        "climate": search.get("climate"),
        "interest": search.get("interest"),
        "travel_type": search.get("travel_type"),
        "month": search.get("month"),
        "query": search.get("query"),
        "result_count": search.get("result_count", 0),
        "searched_at": datetime.now(timezone.utc),
    }

    search_history_collection.insert_one(record)

    return record


def get_search_history(limit: int, user_id: str):

    history = list(
        search_history_collection
        .find({"user_id": user_id}, {"_id": 0})
        .sort("searched_at", -1)
        .limit(limit)
    )

    return history
