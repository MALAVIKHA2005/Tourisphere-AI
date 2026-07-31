from fastapi import APIRouter
from app.services.country_search_service import search_countries

router = APIRouter()


@router.get("/countries/search")
def countries_search(query: str):
    return {"countries": search_countries(query)}
