from fastapi import APIRouter, Depends, HTTPException
from app.services.expense_service import (
    CATEGORIES,
    add_expense,
    delete_expense,
    get_expenses,
)
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/expenses")
def create_expense_route(expense: dict, user_id: str = Depends(get_user_id)):
    try:
        return add_expense(user_id, expense)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/expenses")
def list_expenses_route(user_id: str = Depends(get_user_id)):
    expenses = get_expenses(user_id)

    return {
        "count": len(expenses),
        "expenses": expenses,
        "categories": CATEGORIES,
    }


@router.delete("/expenses/{expense_id}")
def delete_expense_route(expense_id: str, user_id: str = Depends(get_user_id)):
    deleted = delete_expense(expense_id, user_id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")

    return {"message": "Expense deleted successfully"}
