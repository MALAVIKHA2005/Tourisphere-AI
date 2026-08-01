from fastapi import APIRouter
from app.services.education_service import get_education

router = APIRouter()


@router.get("/education")
def education(city: str, country: str = None):

    return get_education(city, country)
