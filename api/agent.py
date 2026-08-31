"""
Agent module: defines tools and runs the Claude tool-use loop.

How it works:
1. We define "tools" — JSON schemas that tell Claude what functions it can call.
2. We send the user's message to Claude along with the tool definitions.
3. Claude either responds directly OR returns a "tool_use" block asking to call
   a function with specific arguments.
4. We execute that function locally, send the result back to Claude, and let it
   decide whether to respond or call another tool.
5. This loop continues until Claude produces a final text response.
"""

import asyncio
import json
import logging
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID
from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env")

import anthropic
from db import (
    find_majors_with_occupations,
    get_tuition_medians,
)

logger = logging.getLogger(__name__)

client = anthropic.AsyncAnthropic()
MODEL = "claude-haiku-4-5-20251001"

# Cap agent loop so a misbehaving model can't spin forever.
# 8 = enough for realistic multi-tool trajectories, small enough that
# a runaway loop stops fast and cheap.
MAX_TOOL_ITERATIONS = 8

# One retry on transient API failure (network blip, 5xx, rate limit).
# More than one retry hides real outages behind long user-facing waits.
MAX_API_RETRIES = 1
RETRY_BACKOFF_SECONDS = 2

# Cap conversation history to keep prompt size + cost bounded.
# 40 = ~20 user/assistant pairs, plenty for a session but stops runaway growth.
MAX_HISTORY_MESSAGES = 40


def _json_default(obj):
    """Explicit JSON coercion for known non-JSON types. Raises on anything else
    so unexpected schema drift is loud instead of silently stringified."""
    if isinstance(obj, (UUID, Decimal)):
        return str(obj)
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


def _trim_history(messages: list[dict]) -> list[dict]:
    """Keep the last MAX_HISTORY_MESSAGES, but never start on a dangling
    tool_result or assistant tool_use — Anthropic requires tool_use/tool_result
    to be paired, so drop leading fragments until the first message is a
    plain user text turn."""
    if len(messages) <= MAX_HISTORY_MESSAGES:
        return messages
    trimmed = messages[-MAX_HISTORY_MESSAGES:]
    while trimmed:
        first = trimmed[0]
        content = first.get("content")
        is_tool_result = (
            first["role"] == "user"
            and isinstance(content, list)
            and any(isinstance(b, dict) and b.get("type") == "tool_result" for b in content)
        )
        is_assistant_fragment = first["role"] == "assistant"
        if is_tool_result or is_assistant_fragment:
            trimmed = trimmed[1:]
        else:
            break
    return trimmed


def _retry_delay_for(exc: Exception) -> float:
    """Honor Anthropic's retry-after header on 429/5xx when present."""
    response = getattr(exc, "response", None)
    if response is not None:
        header = response.headers.get("retry-after")
        if header:
            try:
                return float(header)
            except ValueError:
                pass
    return RETRY_BACKOFF_SECONDS

# --- Tool definitions ---
# Each tool is a JSON schema describing what the function does, its parameters,
# and their types. Claude reads these to decide which tool to call and with what
# arguments.

TOOLS = [
    {
        "name": "find_majors",
        "description": "Search college majors by name and get all linked occupations with annual salaries and relevance scores in one call. Each result includes a major_id (UUID) you can use to build comparison links. Relevance: 1.0 = direct pipeline, 0.7 = common path, 0.4 = possible path. Salary data is from BLS May 2024. BLS caps reported salaries at $239,200/yr.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Partial or full major name to search for (e.g. 'computer', 'nursing', 'engineering')",
                }
            },
            "required": ["query"],
        },
    },
    {
        "name": "get_tuition_medians",
        "description": "Get median annual tuition costs by school type (public in-state, public out-of-state, private nonprofit). Includes sticker price, net price after aid, and full cost of attendance.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
]

# Maps tool names to the actual Python functions
TOOL_DISPATCH = {
    "find_majors": lambda args: find_majors_with_occupations(args["query"]),
    "get_tuition_medians": lambda _args: get_tuition_medians(),
}

SYSTEM_PROMPT = """You are a helpful college advisor agent for the "Should I Go?" app.
You help users compare college majors by showing expected occupation salaries.

When a user asks about a major or career:
1. Use find_majors to search and get all linked occupations with salaries in one call
2. Present the data clearly, noting the weighted average salary and top-earning occupations
3. Always mention that salary data comes from the Bureau of Labor Statistics (BLS) May 2024 Occupational Employment and Wage Statistics

When comparing majors, you can search for multiple in one call (e.g. "engineering" returns all engineering majors) or make separate calls.

When a user asks about a career or job title that doesn't match our data:
- The BLS uses very specific occupation names (e.g. "Market Research Analysts and Marketing Specialists" not "marketing person", "Customer Service Representatives" not "customer success")
- If find_majors returns no results, think about what BLS occupation category the user's career likely falls under and try broader or related search terms
- For example: "customer success" -> try "customer service" or "management"; "data scientist" -> try "computer" or "mathematical"; "UX designer" -> try "design" or "web"
- Tell the user you didn't find an exact match and explain what BLS categories you found that are the closest fit
- Make it clear which BLS occupation name you're mapping their career to and why

Be conversational and ask follow-up questions to help the user think through their decision:
- If a career path doesn't require a college degree (trades, certifications), ask the user about their expected licensing or training costs so you can help them compare

Formatting rules:
- Respond in plain text only. No markdown, no tables, no headers, no bold/italic.
- Use line breaks and short paragraphs to organize information.
- For lists of occupations and salaries, use simple dashes and keep it readable.
- Keep responses concise and conversational.
- Keep responses SHORT. Prefer 2-4 sentences plus a link over a wall of text. If an answer would take more than a short paragraph, summarize the key takeaway and link the user to the right page instead.

CRITICAL: When a user mentions a major by name, you MUST call find_majors first to get the major_id before responding. Never skip the tool call. Never generate a /compare link without a real major_id from find_majors results.

After calling find_majors, always include a link to the Degree Payoff Comparison: /compare?majorId=UUID (using the major_id from find_majors results). Say something like "Instead of hitting you with a wall of numbers, I set up a visual comparison for you" and put the link on its own line. The calculator loads real tuition and salary data and lets users adjust everything interactively. Never try to replicate the calculator's output in chat. Give the user the one or two most important numbers (e.g. weighted average salary, top occupation) and let the calculator handle the rest.

When users ask about loan repayment, costs, ROI, payoff time, or anything that would produce a long numerical breakdown, do NOT write it out. Call find_majors to get the major_id, give a one-sentence summary, and link them to the calculator.

Important notes:
- BLS caps reported salaries at $239,200/yr, so some occupations (surgeons, physicians) earn more than shown
- Relevance scores indicate how directly a major leads to an occupation (1.0 = direct pipeline, 0.4 = possible path)
- Be honest about limitations: these are median salaries, individual outcomes vary widely based on location, experience, school, and market conditions
"""


async def _call_claude(messages: list[dict]):
    """
    Call the Claude API with one retry on transient errors.
    Retriable: rate limit, connection error, 5xx. Non-retriable errors
    (auth, bad request) surface immediately so the caller sees the real cause.
    """
    last_exc: Exception | None = None
    for attempt in range(MAX_API_RETRIES + 1):
        try:
            return await client.messages.create(
                model=MODEL,
                max_tokens=1024,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=messages,
            )
        except (anthropic.APIConnectionError, anthropic.RateLimitError) as exc:
            last_exc = exc
            logger.warning("Anthropic transient error (attempt %d): %s", attempt + 1, exc)
        except anthropic.APIStatusError as exc:
            if exc.status_code and 500 <= exc.status_code < 600:
                last_exc = exc
                logger.warning("Anthropic 5xx (attempt %d): %s", attempt + 1, exc)
            else:
                raise
        if attempt < MAX_API_RETRIES:
            await asyncio.sleep(_retry_delay_for(last_exc))
    if last_exc is None:
        raise RuntimeError("_call_claude exited retry loop without a response or exception")
    raise last_exc


async def run_agent(user_message: str, conversation_history: list[dict] | None = None) -> dict:
    """
    Run the agent loop:
    1. Send user message + tools to Claude
    2. If Claude wants to use a tool, execute it and send result back
    3. Repeat until Claude gives a final text response OR MAX_TOOL_ITERATIONS hit
    4. Return the response and updated conversation history
    """
    messages = list(conversation_history) if conversation_history else []
    messages.append({"role": "user", "content": user_message})
    messages = _trim_history(messages)

    for _ in range(MAX_TOOL_ITERATIONS):
        try:
            response = await _call_claude(messages)
        except anthropic.APIError as exc:
            logger.error("Anthropic API failed after retries: %s", exc)
            return {
                "response": "Sorry, I'm having trouble reaching my brain right now. Please try again in a moment.",
                "conversation_history": messages,
            }

        # Check if Claude wants to use tools or is done
        if response.stop_reason == "tool_use":
            # Claude wants to call one or more tools.
            # The response content has both text blocks and tool_use blocks.
            # We need to execute each tool and send results back.

            # Add Claude's response (with tool_use blocks) to history
            messages.append({"role": "assistant", "content": [b.model_dump() for b in response.content]})

            # Execute each tool call and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input
                    tool_id = block.id

                    # Look up and execute the tool
                    func = TOOL_DISPATCH.get(tool_name)
                    if not func:
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": f"Error: unknown tool '{tool_name}'",
                                "is_error": True,
                            }
                        )
                        continue

                    try:
                        # Run sync DB call in a thread so it doesn't block the event loop.
                        result = await asyncio.to_thread(func, tool_input)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": json.dumps(result, default=_json_default),
                            }
                        )
                    except Exception as exc:
                        # Return the failure to Claude as a tool_result error so it
                        # can recover or explain, instead of 500ing the whole request.
                        logger.exception("Tool %s failed", tool_name)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": f"Error executing {tool_name}: {exc}",
                                "is_error": True,
                            }
                        )

            # Send tool results back to Claude so it can continue
            messages.append({"role": "user", "content": tool_results})

        else:
            # Claude is done (stop_reason == "end_turn"). Extract text response.
            text_response = "".join(
                block.text for block in response.content if block.type == "text"
            )

            messages.append({"role": "assistant", "content": [b.model_dump() for b in response.content]})

            return {
                "response": text_response,
                "conversation_history": messages,
            }

    logger.warning("Agent hit MAX_TOOL_ITERATIONS=%d without finishing", MAX_TOOL_ITERATIONS)
    return {
        "response": "I got stuck working through that. Try rephrasing your question or asking something simpler.",
        "conversation_history": messages,
    }
