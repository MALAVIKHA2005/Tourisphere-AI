from fastapi import APIRouter, Depends
from app.services.history_service import (
    save_travel_history,
    get_travel_history
)
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/travel-history")
def add_history(destination: dict, user_id: str = Depends(get_user_id)):

    save_travel_history(destination, user_id)

    return {
        "message": "Travel history saved successfully."
    }

@router.get("/travel-history")
def fetch_history(limit: int = 10, user_id: str = Depends(get_user_id)):

    history = get_travel_history(limit, user_id)

    return {
        "count": len(history),
        "travel_history": history
    }
