import os
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Response

from app.database.mongodb import users_collection
from app.models.schemas import UserLogin, UserRegister
from app.services.auth_service import (
    create_access_token,
    delete_user_account,
    export_user_data,
    hash_password,
    merge_guest_data,
    verify_password,
)
from app.utils.identity import COOKIE_NAME, get_current_user, get_guest_header

router = APIRouter()

COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        # Cross-site cookies (frontend/backend on different domains in
        # production) require SameSite=None + Secure; same-site localhost
        # dev requires Secure=False since there's no HTTPS.
        samesite="none" if IS_PRODUCTION else "lax",
        secure=IS_PRODUCTION,
        max_age=COOKIE_MAX_AGE_SECONDS,
    )


def _user_out(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
    }


@router.post("/auth/register")
def register(
    payload: UserRegister,
    response: Response,
    guest_id: str = Depends(get_guest_header),
):
    email = payload.email.lower()

    if users_collection.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email is already registered")

    user_doc = {
        "name": payload.name,
        "email": email,
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc),
    }

    result = users_collection.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    user_id = str(result.inserted_id)

    _set_auth_cookie(response, create_access_token(user_id, email))
    merge_guest_data(guest_id, user_id)

    return _user_out(user_doc)


@router.post("/auth/login")
def login(
    payload: UserLogin,
    response: Response,
    guest_id: str = Depends(get_guest_header),
):
    user = users_collection.find_one({"email": payload.email.lower()})

    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])

    _set_auth_cookie(response, create_access_token(user_id, user["email"]))
    merge_guest_data(guest_id, user_id)

    return _user_out(user)


@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME)
    return {"message": "Logged out successfully"}


@router.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return _user_out(user)


@router.get("/auth/me/export")
def export_my_data(user: dict = Depends(get_current_user)):
    """Right to access: a full export of everything tied to this account."""
    return export_user_data(user)


@router.delete("/auth/me")
def delete_my_account(response: Response, user: dict = Depends(get_current_user)):
    """Right to erasure: permanently deletes the account and all its data."""
    delete_user_account(str(user["_id"]))
    response.delete_cookie(COOKIE_NAME)
    return {"message": "Account deleted successfully"}
