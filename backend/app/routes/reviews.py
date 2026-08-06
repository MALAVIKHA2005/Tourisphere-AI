from fastapi import APIRouter, Depends, HTTPException

from app.services.reviews_service import add_review, delete_review, get_reviews
from app.utils.identity import get_current_user

router = APIRouter()

MAX_REVIEW_LENGTH = 1000


@router.post("/reviews")
def create_review(body: dict, user: dict = Depends(get_current_user)):

    destination = body.get("destination")
    rating = body.get("rating")
    text = (body.get("text") or "").strip()

    if not destination:
        raise HTTPException(status_code=400, detail="destination is required")

    if not isinstance(rating, int) or isinstance(rating, bool) or not (1 <= rating <= 5):
        raise HTTPException(status_code=400, detail="rating must be a whole number from 1 to 5")

    if not text:
        raise HTTPException(status_code=400, detail="Review text is required")

    if len(text) > MAX_REVIEW_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Review text is too long (max {MAX_REVIEW_LENGTH} characters)",
        )

    destination_key = add_review(destination, rating, text, str(user["_id"]), user["name"])

    return {"message": "Review saved", "destination_key": destination_key}


@router.get("/reviews")
def list_reviews(destination_key: str):
    return get_reviews(destination_key)


@router.delete("/reviews/{destination_key}")
def remove_review(destination_key: str, user: dict = Depends(get_current_user)):

    removed = delete_review(destination_key, str(user["_id"]))

    if not removed:
        raise HTTPException(status_code=404, detail="Review not found")

    return {"message": "Review removed"}
