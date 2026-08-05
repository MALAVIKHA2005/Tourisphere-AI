from fastapi import APIRouter
from app.services.essential_services_service import get_essential_services

router = APIRouter()


@router.get("/essential-services")
def essential_services(city: str, country: str = None):

    return get_essential_services(city, country)
