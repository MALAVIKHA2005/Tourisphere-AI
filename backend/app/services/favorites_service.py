from datetime import datetime, timezone
from app.database.mongodb import favorites_collection
from app.utils.identity import get_destination_key


def add_favorite(destination: dict, user_id: str):

    destination_key = get_destination_key(destination)

    favorite = {
        "user_id": user_id,
        "destination_key": destination_key,
        "destination": destination,
        "added_at": datetime.now(timezone.utc),
    }

    favorites_collection.update_one(
        {"user_id": user_id, "destination_key": destination_key},
        {"$setOnInsert": favorite},
        upsert=True,
    )

    return destination_key


def get_favorites(user_id: str):

    favorites = list(
        favorites_collection
        .find({"user_id": user_id}, {"_id": 0})
        .sort("added_at", -1)
    )

    return favorites


def remove_favorite(destination_key: str, user_id: str):

    result = favorites_collection.delete_one(
        {"user_id": user_id, "destination_key": destination_key}
    )

    return result.deleted_count > 0
