from fastapi import APIRouter, Depends, HTTPException
from app.services.favorites_service import (
    add_favorite,
    get_favorites,
    remove_favorite,
)
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/favorites")
def create_favorite(destination: dict, user_id: str = Depends(get_user_id)):

    destination_key = add_favorite(destination, user_id)

    return {
        "message": "Favorite added successfully",
        "destination_key": destination_key,
    }


@router.get("/favorites")
def list_favorites(user_id: str = Depends(get_user_id)):

    favorites = get_favorites(user_id)

    return {
        "count": len(favorites),
        "favorites": favorites,
    }


@router.delete("/favorites/{destination_key}")
def delete_favorite(destination_key: str, user_id: str = Depends(get_user_id)):

    removed = remove_favorite(destination_key, user_id)

    if not removed:
        raise HTTPException(status_code=404, detail="Favorite not found")

    return {"message": "Favorite removed successfully"}
