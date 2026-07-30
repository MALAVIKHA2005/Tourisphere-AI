from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Header, HTTPException, Request

from app.database.mongodb import users_collection
from app.services.auth_service import decode_access_token

COOKIE_NAME = "access_token"


def get_guest_header(x_guest_id: Optional[str] = Header(None)) -> Optional[str]:
    return x_guest_id


def get_user_id(request: Request, x_guest_id: Optional[str] = Header(None)) -> str:
    """
    Resolves the current visitor's identity for history/favorites/analytics.

    A logged-in user's JWT cookie takes precedence; otherwise falls back to
    the browser's persistent guest id (Phase 5), then "guest" as a last
    resort for callers that send neither (e.g. Swagger).
    """

    token = request.cookies.get(COOKIE_NAME)

    if token:
        payload = decode_access_token(token)

        if payload and payload.get("sub"):
            return payload["sub"]

    return x_guest_id or "guest"


def get_current_user(request: Request) -> dict:
    """
    Strict dependency for routes that require a logged-in user (e.g. /auth/me).
    Raises 401 if there's no valid session.
    """

    token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_access_token(token)

    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        user = users_collection.find_one({"_id": ObjectId(payload["sub"])})
    except InvalidId:
        user = None

    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return user


def get_destination_key(destination: dict) -> str:
    """
    Stable identifier for a destination across static (has numeric `id`)
    and dynamic Geoapify results (no `id` at all).
    """
    dest_id = destination.get("id")

    if dest_id is not None:
        return str(dest_id)

    name = (destination.get("name") or "").strip().lower()
    country = (destination.get("country") or "").strip().lower()

    return f"{name}|{country}"
