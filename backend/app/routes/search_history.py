from fastapi import APIRouter, Depends
from app.models.schemas import SearchHistoryCreate
from app.services.search_history_service import (
    save_search,
    get_search_history,
)
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/search-history")
def add_search_history(
    search: SearchHistoryCreate, user_id: str = Depends(get_user_id)
):

    save_search(search.model_dump(), user_id)

    return {"message": "Search history saved successfully."}


@router.get("/search-history")
def fetch_search_history(limit: int = 10, user_id: str = Depends(get_user_id)):

    history = get_search_history(limit, user_id)

    return {
        "count": len(history),
        "search_history": history,
    }
