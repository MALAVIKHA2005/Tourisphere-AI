from datetime import datetime, timezone
from app.database.mongodb import travel_history_collection
from app.utils.identity import get_destination_key


def save_travel_history(destination: dict, user_id: str):

    try:

        history = {

            "user_id": user_id,

            "destination_key": get_destination_key(destination),

            "destination": destination.get("name"),

            "country": destination.get("country"),

            "state": destination.get("state"),

            "city": destination.get("city"),

            "temperature": destination.get("temperature"),

            "weather": destination.get("climate"),

            "budget": destination.get("budget"),

            "rating": destination.get("rating"),

            "action": "Viewed",

            "source": "Recommendation",

            "viewed_at": datetime.now(timezone.utc)

        }

        travel_history_collection.insert_one(history)

        print("Travel history saved.")

    except Exception as e:

        print("Travel History Error:", e)

def get_travel_history(limit: int, user_id: str):
    """
    Retrieve the most recent travel history records for this user.
    """

    try:
        history = list(
            travel_history_collection
            .find({"user_id": user_id}, {"_id": 0})
            .sort("viewed_at", -1)
            .limit(limit)
        )

        return history

    except Exception as e:
        print("Travel History Fetch Error:", e)
        return []
