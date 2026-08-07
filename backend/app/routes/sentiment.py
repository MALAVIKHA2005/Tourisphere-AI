from fastapi import APIRouter

from app.services.sentiment_service import get_destination_sentiment

router = APIRouter()


@router.get("/sentiment")
def destination_sentiment(destination_key: str):
    return get_destination_sentiment(destination_key)
