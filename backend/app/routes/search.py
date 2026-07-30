from fastapi import APIRouter
from app.database.mongodb import destinations_collection

router = APIRouter()

@router.get("/search")
def search_destination(query: str):

    results = list(
        destinations_collection.find(
            {
                "name": {
                    "$regex": query,
                    "$options": "i"
                }
            },
            {
                "_id": 0
            }
        )
    )

    return results