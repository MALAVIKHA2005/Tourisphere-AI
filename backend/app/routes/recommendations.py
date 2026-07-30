from fastapi import APIRouter
from app.database.mongodb import destinations_collection

router = APIRouter()

@router.get("/recommendations")
def get_recommendations(
    country: str = None,
    budget: str = None,
    climate: str = None,
    interest: str = None
):

    query = {}

    if country:
        query["country"] = country

    if budget:
        query["budget"] = budget

    if climate:
        query["climate"] = climate

    if interest:
        query["interests"] = interest

    recommendations = list(
        destinations_collection.find(
            query,
            {
                "_id": 0
            }
        )
    )

    return recommendations