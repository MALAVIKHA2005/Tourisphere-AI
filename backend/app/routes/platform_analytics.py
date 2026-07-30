from fastapi import APIRouter
from app.services.platform_analytics_service import get_platform_stats

router = APIRouter()


@router.get("/analytics/platform")
def platform_analytics():
    return get_platform_stats()
