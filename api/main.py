"""
FastAPI server for the college advisor agent.

Endpoints:
- POST /chat  — streaming SSE: progress events then final result
- GET  /health — health check for Railway
"""

import json

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent import run_agent_stream, _json_default

app = FastAPI(title="Should I Go - Agent API")


class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] | None = None
    intake_answers: dict | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/chat")
async def chat(req: ChatRequest):
    async def event_stream():
        async for event in run_agent_stream(req.message, req.conversation_history, req.intake_answers):
            yield f"data: {json.dumps(event, default=_json_default)}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
