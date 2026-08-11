from fastapi import APIRouter

from app.services.trip_planner_service import generate_itinerary

router = APIRouter()


@router.post("/trip-planner/generate")
def trip_planner_generate(body: dict):
    destination = body.get("destination") or ""
    city = body.get("city") or destination
    country = body.get("country") or ""
    days = body.get("days") or 3
    interests = body.get("interests")

    if not destination or not city:
        return {"itinerary": "Pick a destination first.", "sources": {}}

    return generate_itinerary(destination, city, country, days, interests)
