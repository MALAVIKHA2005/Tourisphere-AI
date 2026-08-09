from fastapi import APIRouter, Depends

from app.services import chat_service
from app.services.rag_service import ask
from app.utils.identity import get_user_id

router = APIRouter()


@router.post("/assistant/ask")
def assistant_ask(body: dict, user_id: str = Depends(get_user_id)):
    question = (body.get("question") or "").strip()
    history = body.get("history") or []

    if not question:
        return {"answer": "Ask me something about a destination!", "sources": []}

    chat_service.save_message(user_id, "user", question)

    result = ask(question, history)

    chat_service.save_message(user_id, "assistant", result["answer"], result.get("sources"))

    return result


@router.get("/assistant/history")
def assistant_history(user_id: str = Depends(get_user_id)):
    return {"messages": chat_service.get_history(user_id)}


@router.delete("/assistant/history")
def clear_assistant_history(user_id: str = Depends(get_user_id)):
    chat_service.clear_history(user_id)
    return {"message": "Chat history cleared"}
