import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from bson import ObjectId
from dotenv import load_dotenv

from app.database.mongodb import (
    favorites_collection,
    search_history_collection,
    travel_history_collection,
    users_collection,
)

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRE_DAYS),
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str):
    try:
        return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def merge_guest_data(guest_id: str, user_id: str):
    """
    Reassigns a browser guest's travel history, search history and
    favorites onto their real account after register/login, so signing up
    doesn't wipe out what they already did as a guest.
    """

    if not guest_id or guest_id == user_id:
        return

    travel_history_collection.update_many(
        {"user_id": guest_id}, {"$set": {"user_id": user_id}}
    )

    search_history_collection.update_many(
        {"user_id": guest_id}, {"$set": {"user_id": user_id}}
    )

    guest_favorites = list(favorites_collection.find({"user_id": guest_id}))

    for favorite in guest_favorites:
        favorites_collection.update_one(
            {"user_id": user_id, "destination_key": favorite["destination_key"]},
            {
                "$setOnInsert": {
                    "user_id": user_id,
                    "destination_key": favorite["destination_key"],
                    "destination": favorite["destination"],
                    "added_at": favorite.get("added_at", datetime.now(timezone.utc)),
                }
            },
            upsert=True,
        )

    favorites_collection.delete_many({"user_id": guest_id})


def export_user_data(user: dict) -> dict:
    """
    Right to access: everything this platform holds about the account,
    in one document.
    """

    user_id = str(user["_id"])

    return {
        "profile": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "created_at": user.get("created_at"),
        },
        "travel_history": list(
            travel_history_collection.find({"user_id": user_id}, {"_id": 0})
        ),
        "search_history": list(
            search_history_collection.find({"user_id": user_id}, {"_id": 0})
        ),
        "favorites": list(
            favorites_collection.find({"user_id": user_id}, {"_id": 0})
        ),
    }


def delete_user_account(user_id: str):
    """Right to erasure: permanently removes the account and everything tied to it."""

    travel_history_collection.delete_many({"user_id": user_id})
    search_history_collection.delete_many({"user_id": user_id})
    favorites_collection.delete_many({"user_id": user_id})
    users_collection.delete_one({"_id": ObjectId(user_id)})
