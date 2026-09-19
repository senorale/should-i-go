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
    run_sql,
    search_schools,
    get_school_programs,
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
        "description": "Get national median annual tuition costs by school type (public in-state, public out-of-state, private nonprofit). Includes sticker price, net price after aid, and full cost of attendance. Use this for general cost comparisons when no specific school is named.",
        "input_schema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "search_schools",
        "description": "Search colleges by name, state, or both. Returns up to 10 matches (graduation rate >= 70%) with real tuition, net price by income bracket, graduation rate, median debt, and earnings. Use when a user names a specific school, wants to compare schools, or explore schools in a state. Use the filter and sort params based on the user's stated preferences from intake.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "School name to search for (e.g. 'University of Florida', 'MIT'). Optional if state is provided.",
                },
                "state": {
                    "type": "string",
                    "description": "Two-letter US state code (e.g. 'FL', 'CA'). Optional if name is provided.",
                },
                "ownership": {
                    "type": "string",
                    "enum": ["public", "private"],
                    "description": "Filter by school type. Omit to include both.",
                },
                "max_net_price": {
                    "type": "integer",
                    "description": "Maximum annual net price after aid. Omit for no limit.",
                },
                "size": {
                    "type": "string",
                    "enum": ["small", "medium", "large"],
                    "description": "Filter by student body size: small (<5k), medium (5k-15k), large (15k+). Omit for no preference.",
                },
                "sort_by": {
                    "type": "string",
                    "enum": ["earnings", "graduation_rate", "net_price", "median_debt"],
                    "description": "How to rank results. earnings=highest first, graduation_rate=highest first, net_price=lowest first, median_debt=lowest first.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_school_programs",
        "description": "Get per-program earnings at a specific school. Returns median earnings 1 year and 4 years after graduation for each program (major) offered, filtered optionally by major name. Requires a school_id from search_schools results. Use this to answer 'What do CS graduates from UF actually earn?' or to compare the same major across schools.",
        "input_schema": {
            "type": "object",
            "properties": {
                "school_id": {
                    "type": "integer",
                    "description": "The school's College Scorecard ID (from search_schools results)",
                },
                "major_search": {
                    "type": "string",
                    "description": "Optional: filter programs by name (e.g. 'computer', 'nursing'). Omit to get all programs with earnings data.",
                },
            },
            "required": ["school_id"],
        },
    },
    {
        "name": "run_sql",
        "description": """Run a read-only SQL SELECT query against the database. Only SELECT statements are allowed. Results are capped at 50 rows.

Database schema (PostgreSQL, all table/column names are double-quoted):

"Major" (id UUID PK, name TEXT UNIQUE, created_at, updated_at)
  Sample: id='abc-123', name='Computer Science'

"OccupationCategory" (id UUID PK, name TEXT UNIQUE, occupation_code TEXT UNIQUE, created_at, updated_at)
  Sample: id='def-456', name='Computer and Mathematical Occupations', occupation_code='15-0000'

"OccupationSubCategory" (id UUID PK, name TEXT, occupation_code TEXT, annual_salary FLOAT, category_id UUID FK->OccupationCategory.id, typical_years_of_school FLOAT NULL, created_at, updated_at)
  Sample: id='ghi-789', name='Software Developers', occupation_code='15-1252', annual_salary=132270.0, typical_years_of_school=4.0

"MajorOccupation" (id UUID PK, major_id UUID FK->Major.id, occupation_id UUID FK->OccupationSubCategory.id, relevance FLOAT)
  Links majors to occupations. relevance: 1.0=direct pipeline, 0.7=common path, 0.4=possible path

"TuitionMedian" (id UUID PK, cohort TEXT UNIQUE, label TEXT, sticker_annual INT NULL, net_price_annual INT NULL, cost_of_attendance_annual INT NULL, sample_size INT, source TEXT, created_at, updated_at)
  Cohorts: public_in_state, public_out_of_state, private_nonprofit, all""",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "A SQL SELECT query to run against the database",
                }
            },
            "required": ["query"],
        },
    },
]

_VISUAL_TOOLS = {"find_majors", "search_schools", "get_school_programs", "get_tuition_medians"}

_TOOL_PROGRESS = {
    "find_majors": ("Searching majors…", "Found matching majors"),
    "search_schools": ("Looking up schools…", "Found schools"),
    "get_school_programs": ("Pulling program earnings…", "Got program data"),
    "get_tuition_medians": ("Getting tuition data…", "Got tuition data"),
    "run_sql": ("Querying database…", "Query complete"),
}

TOOL_DISPATCH = {
    "find_majors": lambda args: find_majors_with_occupations(args["query"]),
    "get_tuition_medians": lambda _args: get_tuition_medians(),
    "search_schools": lambda args: search_schools(
        args.get("name"), args.get("state"), args.get("ownership"),
        args.get("max_net_price"), args.get("size"), args.get("sort_by"),
    ),
    "get_school_programs": lambda args: get_school_programs(args["school_id"], args.get("major_search")),
    "run_sql": lambda args: run_sql(args["query"]),
}

SYSTEM_PROMPT = """You are a college counselor agent for the "Should I Go?" app. You give personalized, data-driven guidance based on each user's situation.

TOOLS YOU HAVE:

1. find_majors(query) - Search majors by name. Returns linked occupations with BLS salaries, relevance scores, and major_id (UUID) for comparison links. Use when users ask about majors, careers from a major, or salary outcomes.

2. get_tuition_medians() - National median tuition by school type (public in-state, out-of-state, private). Use for general cost questions when no specific school is named.

3. search_schools(name, state, ownership, max_net_price, sort_by) - Search schools with filters. Only returns schools with graduation rate >= 70% and complete data. Use the user's intake preferences (school type, budget, sort metric) as filter params. Sort options: earnings (highest first), graduation_rate (highest first), net_price (lowest first), median_debt (lowest first).

4. get_school_programs(school_id, major_search?) - Per-program earnings at a specific school (1yr and 4yr after graduation). Requires school_id from search_schools. Use to answer "What do CS grads from UF earn?" or compare the same major across schools.

5. run_sql(query) - Read-only SQL against the database. Use for analytical questions the other tools can't answer: counting majors, finding highest-paying occupations across all fields, listing categories, occupation overlap between majors, etc.

USER SEGMENTS AND HOW TO HELP EACH:

Segment 1: Not in college, considering going (high school students, working adults, "not sure" about college)
- Answer: Is college worth it financially? How much will it cost? How long until a degree pays for itself?
- Use get_tuition_medians for general cost picture, search_schools when they name a school
- Use find_majors to compare salary outcomes for fields they're interested in
- Use run_sql for break-even analysis (tuition vs. salary premium over HS diploma), occupations with fewer years of school (WHERE typical_years_of_school <= 2)
- If they opted into finances deep dive: walk through total debt, interest rates, repayment timelines, monthly payments
- If they mention trades or alternatives to college: compare no-degree occupation salaries honestly, ask about their expected training/licensing costs

Segment 2: In college, picking or changing a major
- Answer: Which major leads to highest-paying careers? How many options does each major open? Side-by-side comparisons.
- Use find_majors for both current and target majors
- Use run_sql for occupation overlap between majors, career option counts, weighted average salary
- Use get_school_programs when they name their school, to show program-specific earnings there
- If considering dropping out: compare their current major's outcomes to no-degree paths honestly

Segment 3: Graduated or not in school, comparing occupations
- Answer: What careers match my degree? Am I underpaid? What education is needed for a career change?
- Use find_majors to show all occupations linked to their degree
- Use run_sql to compare salaries across occupations, browse categories, check education requirements
- Use get_school_programs for what graduates of their school/program actually earn
- If they opted into finances deep dive: help them understand their total debt cost and whether their earnings justify it

TOOL USAGE RULES:

- CRITICAL: When a user mentions a major by name, you MUST call find_majors first to get the major_id. Never generate a /compare link without a real major_id from find_majors results.
- When a user names a specific school, call search_schools to get real data. Never guess tuition or earnings.
- To get program-level earnings, call search_schools first (to get school_id), then get_school_programs.
- When comparing majors, search for multiple in one call (e.g. "engineering" returns all engineering majors) or make separate calls.

BLS OCCUPATION MATCHING:
- BLS uses specific names ("Market Research Analysts and Marketing Specialists" not "marketing person")
- If find_majors returns no results, try broader terms: "customer success" -> "customer service"; "data scientist" -> "computer"; "UX designer" -> "design"
- Tell the user what BLS category you mapped to and why

RESPONSE RULES:
- Tool results are rendered visually in the chat automatically. You do NOT need to repeat data the tools returned. Never list salaries, tuition, earnings, or other numbers that the tool already provided.
- Keep responses to 1-2 sentences. State the key insight or takeaway, then ask a follow-up question.
- Do NOT generate /compare links. The visual data display is handled automatically.
- Respond in plain text only. No markdown, no tables, no headers, no bold/italic.
- Be conversational. Ask follow-up questions to guide the user.
- BLS caps reported salaries at $239,200/yr (surgeons, physicians may earn more).
- Be honest about limitations: these are median salaries, individual outcomes vary by location, experience, school, and market conditions.
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


async def run_agent_stream(user_message: str, conversation_history: list[dict] | None = None):
    """Async generator yielding progress events then a final result.

    Event shapes:
      {"event": "progress", "message": "Searching majors…"}
      {"event": "complete", "response": "...", "data_blocks": [...], "conversation_history": [...]}
    """
    messages = list(conversation_history) if conversation_history else []
    messages.append({"role": "user", "content": user_message})
    messages = _trim_history(messages)
    data_blocks: list[dict] = []

    for _ in range(MAX_TOOL_ITERATIONS):
        try:
            yield {"event": "progress", "message": "Thinking…"}
            response = await _call_claude(messages)
        except anthropic.APIError as exc:
            logger.error("Anthropic API failed after retries: %s", exc)
            yield {
                "event": "complete",
                "response": "Sorry, I'm having trouble right now. Please try again in a moment.",
                "data_blocks": [],
                "conversation_history": messages,
            }
            return

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": [b.model_dump() for b in response.content]})

            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input
                    tool_id = block.id

                    progress_start, progress_done = _TOOL_PROGRESS.get(
                        tool_name, (f"Running {tool_name}…", f"{tool_name} done")
                    )
                    yield {"event": "progress", "message": progress_start}

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
                        result = await asyncio.to_thread(func, tool_input)
                        result_json = json.dumps(result, default=_json_default)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": result_json,
                            }
                        )
                        if tool_name in _VISUAL_TOOLS and not (isinstance(result, dict) and "error" in result):
                            data_blocks.append({"type": tool_name, "data": result})
                        yield {"event": "progress", "message": progress_done}
                    except Exception as exc:
                        logger.exception("Tool %s failed", tool_name)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": f"Error executing {tool_name}: {exc}",
                                "is_error": True,
                            }
                        )

            messages.append({"role": "user", "content": tool_results})
            yield {"event": "progress", "message": "Putting report together…"}

        else:
            text_response = "".join(
                block.text for block in response.content if block.type == "text"
            )
            messages.append({"role": "assistant", "content": [b.model_dump() for b in response.content]})

            yield {
                "event": "complete",
                "response": text_response,
                "data_blocks": data_blocks,
                "conversation_history": messages,
            }
            return

    logger.warning("Agent hit MAX_TOOL_ITERATIONS=%d without finishing", MAX_TOOL_ITERATIONS)
    yield {
        "event": "complete",
        "response": "I got stuck working through that. Try rephrasing your question or asking something simpler.",
        "data_blocks": data_blocks,
        "conversation_history": messages,
    }
