"""
LLM-as-judge scorers — use Haiku to grade subjective response quality.

Three judges:
- faithfulness: does the response only use facts from tool output?
- helpfulness: does it answer what the user actually asked?
- bls_attribution: does it credit BLS when citing salary data?

Each returns {"score": int 1-5, "reason": str}.
"""

import json
import logging
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

import anthropic

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).resolve().parent / "prompts"
JUDGE_MODEL = "claude-haiku-4-5-20251001"

_client = anthropic.AsyncAnthropic()


def _load_prompt(name: str) -> str:
    return (PROMPTS_DIR / f"{name}.txt").read_text()


def _extract_tool_output(conversation_history: list[dict]) -> str:
    """Pull raw tool result content from conversation history."""
    outputs = []
    for msg in conversation_history:
        if msg.get("role") != "user":
            continue
        content = msg.get("content", [])
        if not isinstance(content, list):
            continue
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_result":
                raw = block.get("content", "")
                outputs.append(raw)
    return "\n---\n".join(outputs) if outputs else "(no tool calls made)"


def _extract_json(text: str) -> dict:
    """Extract first JSON object from text, even if surrounded by prose."""
    start = text.find("{")
    if start == -1:
        raise json.JSONDecodeError("No JSON object found", text, 0)
    depth = 0
    for i in range(start, len(text)):
        if text[i] == "{":
            depth += 1
        elif text[i] == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start:i + 1])
    raise json.JSONDecodeError("Unclosed JSON object", text, start)


async def _run_judge(system_prompt: str, user_content: str) -> dict:
    """Call Haiku with a judge prompt, parse JSON response."""
    try:
        response = await _client.messages.create(
            model=JUDGE_MODEL,
            max_tokens=256,
            temperature=0,
            system=system_prompt,
            messages=[{"role": "user", "content": user_content}],
        )
        text = "".join(b.text for b in response.content if b.type == "text")
        return _extract_json(text)
    except (json.JSONDecodeError, Exception) as exc:
        logger.error("Judge failed: %s", exc)
        return {"score": 0, "reason": f"judge error: {exc}"}


async def faithfulness(
    user_message: str,
    response: str,
    conversation_history: list[dict],
) -> dict:
    system = _load_prompt("faithfulness_v1")
    tool_output = _extract_tool_output(conversation_history)
    user_content = (
        f"USER_MESSAGE:\n{user_message}\n\n"
        f"TOOL_OUTPUT:\n{tool_output}\n\n"
        f"AGENT_RESPONSE:\n{response}"
    )
    return await _run_judge(system, user_content)


async def helpfulness(user_message: str, response: str) -> dict:
    system = _load_prompt("helpfulness_v1")
    user_content = (
        f"USER_MESSAGE:\n{user_message}\n\n"
        f"AGENT_RESPONSE:\n{response}"
    )
    return await _run_judge(system, user_content)


async def bls_attribution(user_message: str, response: str) -> dict:
    system = _load_prompt("bls_attribution_v1")
    user_content = (
        f"USER_MESSAGE:\n{user_message}\n\n"
        f"AGENT_RESPONSE:\n{response}"
    )
    return await _run_judge(system, user_content)


async def run_all_judges(
    user_message: str,
    response: str,
    conversation_history: list[dict],
) -> dict[str, dict]:
    """Run all three judges in parallel. Returns {judge_name: {score, reason}}."""
    import asyncio

    faith, helpful, bls = await asyncio.gather(
        faithfulness(user_message, response, conversation_history),
        helpfulness(user_message, response),
        bls_attribution(user_message, response),
    )
    return {
        "faithfulness": faith,
        "helpfulness": helpful,
        "bls_attribution": bls,
    }
