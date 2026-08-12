from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from app.database.mongodb import bookings_collection

VALID_TYPES = {"hotel", "restaurant"}


def _today_str():
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _serialize(doc):
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


def create_booking(user_id: str, booking: dict) -> dict:
    """
    Books a real hotel or restaurant the platform already surfaced (its own
    live Xotelo/Geoapify data, echoed back by the frontend at booking time)
    -- there's no separate "book a place" search, only "book this real
    place you were just looking at". No payment is taken or fabricated;
    this is a genuine reservation record, not a mocked checkout.
    """

    booking_type = booking.get("type")
    if booking_type not in VALID_TYPES:
        raise ValueError("type must be 'hotel' or 'restaurant'")

    place = booking.get("place") or {}
    place_name = (place.get("name") or "").strip()
    if not place_name:
        raise ValueError("place.name is required")

    destination = booking.get("destination") or {}
    if not (destination.get("name") or destination.get("city")):
        raise ValueError("destination.name or destination.city is required")

    today = _today_str()
    doc = {
        "user_id": user_id,
        "type": booking_type,
        "destination": {
            "name": destination.get("name"),
            "city": destination.get("city"),
            "country": destination.get("country"),
        },
        "place": place,
        "status": "confirmed",
        "created_at": datetime.now(timezone.utc),
        "cancelled_at": None,
    }

    if booking_type == "hotel":
        check_in = booking.get("check_in")
        check_out = booking.get("check_out")

        if not check_in or not check_out:
            raise ValueError("check_in and check_out are required for a hotel booking")
        if check_in < today:
            raise ValueError("check_in cannot be in the past")
        if check_out <= check_in:
            raise ValueError("check_out must be after check_in")

        guests = booking.get("guests") or 1
        try:
            guests = int(guests)
        except (TypeError, ValueError):
            raise ValueError("guests must be a number")
        if guests < 1:
            raise ValueError("guests must be at least 1")

        doc["check_in"] = check_in
        doc["check_out"] = check_out
        doc["guests"] = guests

    else:  # restaurant
        reservation_date = booking.get("reservation_date")
        reservation_time = booking.get("reservation_time") or "19:00"
        party_size = booking.get("party_size") or 2

        if not reservation_date:
            raise ValueError("reservation_date is required for a restaurant booking")
        if reservation_date < today:
            raise ValueError("reservation_date cannot be in the past")

        try:
            party_size = int(party_size)
        except (TypeError, ValueError):
            raise ValueError("party_size must be a number")
        if party_size < 1:
            raise ValueError("party_size must be at least 1")

        doc["reservation_date"] = reservation_date
        doc["reservation_time"] = reservation_time
        doc["party_size"] = party_size

    result = bookings_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    doc["booking_reference"] = f"TSP-{str(result.inserted_id)[-6:].upper()}"

    bookings_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {"booking_reference": doc["booking_reference"]}},
    )

    return _serialize(doc)


def get_bookings(user_id: str) -> list:
    bookings = bookings_collection.find({"user_id": user_id}).sort("created_at", -1)
    return [_serialize(b) for b in bookings]


def cancel_booking(booking_id: str, user_id: str) -> bool:
    try:
        oid = ObjectId(booking_id)
    except InvalidId:
        return False

    result = bookings_collection.update_one(
        {"_id": oid, "user_id": user_id, "status": {"$ne": "cancelled"}},
        {"$set": {"status": "cancelled", "cancelled_at": datetime.now(timezone.utc)}},
    )

    return result.modified_count > 0
