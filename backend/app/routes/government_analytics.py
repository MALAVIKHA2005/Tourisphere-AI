from fastapi import APIRouter
from app.services.government_analytics_service import get_government_analytics

router = APIRouter()


@router.get("/analytics/government")
def government_analytics_route():
    return get_government_analytics()
