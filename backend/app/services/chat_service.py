from datetime import datetime, timezone

from app.database.mongodb import chat_history_collection

MAX_HISTORY = 50


def save_message(user_id: str, role: str, content: str, sources=None):
    chat_history_collection.insert_one({
        "user_id": user_id,
        "role": role,
        "content": content,
        "sources": sources or [],
        "created_at": datetime.now(timezone.utc),
    })


def get_history(user_id: str, limit: int = MAX_HISTORY):
    return list(
        chat_history_collection
        .find({"user_id": user_id}, {"_id": 0})
        .sort("created_at", 1)
        .limit(limit)
    )


def clear_history(user_id: str):
    chat_history_collection.delete_many({"user_id": user_id})
