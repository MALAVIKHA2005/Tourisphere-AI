from fastapi import APIRouter
from app.services.transport_service import get_route

router = APIRouter()


@router.get("/route")
def route(from_place: str, to_place: str, mode: str = "drive"):

    return get_route(from_place, to_place, mode)
