from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId

from app.database.mongodb import expenses_collection

CATEGORIES = ["Accommodation", "Food", "Transport", "Activities", "Shopping", "Other"]
CURRENCIES = {"USD", "INR", "EUR", "GBP", "JPY"}


def _serialize(doc):
    doc = dict(doc)
    doc["id"] = str(doc.pop("_id"))
    return doc


def add_expense(user_id: str, expense: dict) -> dict:
    category = expense.get("category")
    if category not in CATEGORIES:
        raise ValueError(f"category must be one of {', '.join(CATEGORIES)}")

    currency = (expense.get("currency") or "").upper()
    if currency not in CURRENCIES:
        raise ValueError(f"currency must be one of {', '.join(sorted(CURRENCIES))}")

    try:
        amount = float(expense.get("amount"))
    except (TypeError, ValueError):
        raise ValueError("amount must be a number")
    if amount <= 0:
        raise ValueError("amount must be greater than 0")

    date = expense.get("date")
    if not date:
        raise ValueError("date is required")

    destination = expense.get("destination") or {}
    note = (expense.get("note") or "").strip()[:200]

    doc = {
        "user_id": user_id,
        "category": category,
        "amount": round(amount, 2),
        "currency": currency,
        "date": date,
        "destination": {
            "name": destination.get("name"),
            "city": destination.get("city"),
            "country": destination.get("country"),
        } if destination.get("name") else None,
        "note": note,
        "created_at": datetime.now(timezone.utc),
    }

    result = expenses_collection.insert_one(doc)
    doc["_id"] = result.inserted_id

    return _serialize(doc)


def get_expenses(user_id: str) -> list:
    expenses = expenses_collection.find({"user_id": user_id}).sort("date", -1)
    return [_serialize(e) for e in expenses]


def delete_expense(expense_id: str, user_id: str) -> bool:
    try:
        oid = ObjectId(expense_id)
    except InvalidId:
        return False

    result = expenses_collection.delete_one({"_id": oid, "user_id": user_id})
    return result.deleted_count > 0
