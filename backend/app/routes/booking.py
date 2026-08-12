from fastapi import APIRouter, Depends, HTTPException
from app.services.booking_service import (
    cancel_booking,
    create_booking,
    get_bookings,
)
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/bookings")
def create_booking_route(booking: dict, user_id: str = Depends(get_user_id)):
    try:
        return create_booking(user_id, booking)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/bookings")
def list_bookings_route(user_id: str = Depends(get_user_id)):
    bookings = get_bookings(user_id)

    return {
        "count": len(bookings),
        "bookings": bookings,
    }


@router.patch("/bookings/{booking_id}/cancel")
def cancel_booking_route(booking_id: str, user_id: str = Depends(get_user_id)):
    cancelled = cancel_booking(booking_id, user_id)

    if not cancelled:
        raise HTTPException(status_code=404, detail="Booking not found or already cancelled")

    return {"message": "Booking cancelled successfully"}
