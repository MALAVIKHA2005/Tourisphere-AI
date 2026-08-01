from fastapi import APIRouter
from app.services.state_search_service import get_states

router = APIRouter()


@router.get("/states")
def states(country: str):

    return {"states": get_states(country)}
