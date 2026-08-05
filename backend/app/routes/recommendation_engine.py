from fastapi import APIRouter, Depends
from app.services.recommendation_engine import (
    get_similar_destinations,
    get_recommended_for_you,
)
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/similar-destinations")
def similar_destinations(destination: dict, limit: int = 4):

    return get_similar_destinations(destination, limit)


@router.get("/recommended-for-you")
def recommended_for_you(limit: int = 8, user_id: str = Depends(get_user_id)):

    return get_recommended_for_you(user_id, limit)
