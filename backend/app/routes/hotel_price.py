from fastapi import APIRouter
from app.services.hotel_price_service import get_average_hotel_price

router = APIRouter()


@router.get("/hotel-price")
def hotel_price(city: str, country: str = None):

    return get_average_hotel_price(city, country)
