"""
FastAPI server for the college advisor agent.

Endpoints:
- POST /chat  — send a message, get agent response
- GET  /health — health check for Railway
"""

from fastapi import FastAPI
from pydantic import BaseModel
from agent import run_agent

app = FastAPI(title="Should I Go - Agent API")


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] | None = None


class ChatResponse(BaseModel):
    response: str
    conversation_history: list[dict]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest):
    result = run_agent(req.message, req.conversation_history)
    return ChatResponse(
        response=result["response"],
        conversation_history=result["conversation_history"],
    )
