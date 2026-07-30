from fastapi import APIRouter
from app.services.currency_service import get_exchange_rates

router = APIRouter()


@router.get("/currency-rates")
def currency_rates():
    return get_exchange_rates()
