from fastapi import APIRouter
from app.database.mongodb import destinations_collection
from app.services.destination_service import get_places

router = APIRouter()


@router.get("/destinations")
def get_destinations():

    destinations = list(
        destinations_collection.find(
            {},
            {"_id": 0}
        )
    )

    return destinations


@router.get("/dynamic-destinations")
def dynamic_destinations(country: str, state: str = None):

    return get_places(country, state)