from fastapi import APIRouter
from app.services.lifestyle_service import get_lifestyle

router = APIRouter()


@router.get("/lifestyle")
def lifestyle(city: str, country: str = None):

    return get_lifestyle(city, country)
