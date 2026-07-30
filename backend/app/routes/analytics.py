from fastapi import APIRouter, Depends
from app.services.analytics_service import get_dashboard, get_dataset
from app.utils.identity import get_user_id

router = APIRouter()


@router.get("/analytics/dashboard")
def analytics_dashboard(user_id: str = Depends(get_user_id)):

    return get_dashboard(user_id)


@router.get("/analytics/dataset")
def analytics_dataset(limit: int = 200, user_id: str = Depends(get_user_id)):

    dataset = get_dataset(user_id, limit)

    return {
        "count": len(dataset),
        "dataset": dataset,
    }
