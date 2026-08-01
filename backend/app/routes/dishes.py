from fastapi import APIRouter
from app.data.popular_dishes import get_popular_dishes

router = APIRouter()


@router.get("/dishes")
def dishes(country: str):

    return {"dishes": get_popular_dishes(country)}
