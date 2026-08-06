from datetime import datetime, timezone

from app.database.mongodb import reviews_collection
from app.utils.identity import get_destination_key


def add_review(destination: dict, rating: int, text: str, user_id: str, user_name: str) -> str:

    destination_key = get_destination_key(destination)

    reviews_collection.update_one(
        {"user_id": user_id, "destination_key": destination_key},
        {
            "$set": {
                "user_id": user_id,
                "user_name": user_name,
                "destination_key": destination_key,
                "destination_name": destination.get("name"),
                "rating": rating,
                "text": text,
                "updated_at": datetime.now(timezone.utc),
            },
            "$setOnInsert": {
                "created_at": datetime.now(timezone.utc),
            },
        },
        upsert=True,
    )

    return destination_key


def get_reviews(destination_key: str) -> dict:

    reviews = list(
        reviews_collection
        .find({"destination_key": destination_key}, {"_id": 0})
        .sort("created_at", -1)
    )

    count = len(reviews)
    average_rating = round(sum(r["rating"] for r in reviews) / count, 1) if count else None

    return {
        "reviews": reviews,
        "count": count,
        "averageRating": average_rating,
    }


def delete_review(destination_key: str, user_id: str) -> bool:

    result = reviews_collection.delete_one(
        {"user_id": user_id, "destination_key": destination_key}
    )

    return result.deleted_count > 0
