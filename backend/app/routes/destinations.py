from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter
from app.database.mongodb import destinations_collection
from app.services.destination_service import get_places
from app.services.popularity_service import get_popularity
from app.services.climate_service import get_best_months
from app.services.hotel_price_service import get_budget_tier

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
    # case an older seed still has them stored. Budget used to be a
    # curator's static "Low/Medium/High" guess -- also stripped, since it's
    # now derived live below from the exact same real hotel-price source
    # the destination modal already used for its own Budget stat, instead
    # of the two silently disagreeing for the same destination.
    for d in destinations:
        d.pop("safetyScore", None)
        d.pop("familyScore", None)
        d.pop("budget", None)

    # Real Wikipedia page views, real climate-derived Best Months, and a
    # real hotel-price-derived Budget tier, fetched in parallel and
    # overriding whatever (if anything) is stored in Mongo -- same
    # live-data treatment as the dynamic destinations, not a one-time
    # seeded guess. Kept in separate pools with different worker counts --
    # the Open-Meteo archive call is heavy enough that 20 at once timed out
    # too often, and the hotel-price lookup already fans out internally
    # (up to 3 concurrent rate lookups per destination), so a smaller
    # outer pool keeps total concurrent Xotelo requests reasonable.
    def _attach_popularity(d):
        d["popularity"] = get_popularity(d.get("name"), d.get("city"))

    def _attach_best_months(d):
        d["bestMonths"] = get_best_months(d.get("city"), d.get("country"))

    def _attach_budget(d):
        d["budget"] = get_budget_tier(d.get("city") or d.get("name"), d.get("country"))

    if destinations:
        with ThreadPoolExecutor(max_workers=20) as pool:
            pool.map(_attach_popularity, destinations)

        with ThreadPoolExecutor(max_workers=6) as pool:
            pool.map(_attach_best_months, destinations)

        with ThreadPoolExecutor(max_workers=5) as pool:
            pool.map(_attach_budget, destinations)

    return destinations


@router.get("/dynamic-destinations")
def dynamic_destinations(country: str, state: str = None, city: str = None):

    return get_places(country, state, city)