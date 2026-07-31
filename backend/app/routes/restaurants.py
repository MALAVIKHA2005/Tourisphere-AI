from fastapi import APIRouter
from app.services.restaurant_service import get_restaurants

router = APIRouter()


@router.get("/restaurants")
def restaurants(city: str, country: str = None):

    return {"restaurants": get_restaurants(city, country)}
