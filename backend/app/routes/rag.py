from fastapi import APIRouter

from app.services.rag_service import ask

router = APIRouter()


@router.post("/assistant/ask")
def assistant_ask(body: dict):
    question = (body.get("question") or "").strip()
    history = body.get("history") or []

    if not question:
        return {"answer": "Ask me something about a destination!", "sources": []}

    return ask(question, history)
