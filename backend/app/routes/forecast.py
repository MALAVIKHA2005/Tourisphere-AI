from fastapi import APIRouter
from app.services.forecast_service import get_interest_trend

router = APIRouter()


@router.get("/interest-trend")
def interest_trend(name: str, city: str = None):

    result = get_interest_trend(name, city)

    if result is None:
        return {"available": False}

    return {"available": True, **result}
