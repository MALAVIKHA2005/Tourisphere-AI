from fastapi import APIRouter
from app.services.weather_service import get_weather_by_city

router = APIRouter()


@router.get("/weather")
def weather(city: str):
    return get_weather_by_city(city)
