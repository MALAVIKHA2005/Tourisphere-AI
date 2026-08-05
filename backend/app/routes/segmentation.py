from fastapi import APIRouter, Depends
from app.services.segmentation_service import get_user_segment
from app.utils.identity import get_user_id

router = APIRouter()


@router.get("/user-segment")
def user_segment(user_id: str = Depends(get_user_id)):

    segment = get_user_segment(user_id)

    if segment is None:
        return {"available": False}

    return {"available": True, **segment}
