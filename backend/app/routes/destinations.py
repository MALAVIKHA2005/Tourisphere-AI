from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter
from app.database.mongodb import destinations_collection
from app.services.destination_service import get_places
from app.services.popularity_service import get_popularity

router = APIRouter()


@router.get("/destinations")
def get_destinations():

    destinations = list(
        destinations_collection.find(
            {},
            {"_id": 0}
        )
    )

    # Safety Score/Family Score have no honest data source (see
    # lifestyle_service.py's "family" category for the real replacement,
    # derived per-destination in the modal) -- strip them defensively in
    # case an older seed still has them stored.
    for d in destinations:
        d.pop("safetyScore", None)
        d.pop("familyScore", None)

    # Real Wikipedia page views, fetched in parallel and overriding
    # whatever (if anything) is stored in Mongo -- same live-data
    # treatment as the dynamic destinations, not a one-time seeded guess.
    def _attach_popularity(d):
        d["popularity"] = get_popularity(d.get("name"), d.get("city"))

    if destinations:
        with ThreadPoolExecutor(max_workers=20) as pool:
            pool.map(_attach_popularity, destinations)

    return destinations


@router.get("/dynamic-destinations")
def dynamic_destinations(country: str, state: str = None, city: str = None):

    return get_places(country, state, city)