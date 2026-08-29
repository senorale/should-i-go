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

import json
from dotenv import load_dotenv
load_dotenv(dotenv_path="../.env")

import anthropic
from db import (
    find_majors_with_occupations,
    get_tuition_medians,
)

client = anthropic.Anthropic()
MODEL = "claude-haiku-4-5-20251001"

# --- Tool definitions ---
# Each tool is a JSON schema describing what the function does, its parameters,
# and their types. Claude reads these to decide which tool to call and with what
# arguments.

TOOLS = [
    {
        "name": "find_majors",
        "description": "Search college majors by name and get all linked occupations with annual salaries and relevance scores in one call. Relevance: 1.0 = direct pipeline, 0.7 = common path, 0.4 = possible path. Salary data is from BLS May 2024. BLS caps reported salaries at $239,200/yr.",
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
- Ask about their location, since salaries vary significantly by region
- Ask what factors matter most to them beyond salary (job satisfaction, work-life balance, job growth outlook)
- If they seem undecided, ask what subjects they enjoy or what kind of work environment they prefer

Formatting rules:
- Respond in plain text only. No markdown, no tables, no headers, no bold/italic.
- Use line breaks and short paragraphs to organize information.
- For lists of occupations and salaries, use simple dashes and keep it readable.
- Keep responses concise and conversational.

Important notes:
- BLS caps reported salaries at $239,200/yr, so some occupations (surgeons, physicians) earn more than shown
- Relevance scores indicate how directly a major leads to an occupation (1.0 = direct pipeline, 0.4 = possible path)
- Be honest about limitations: these are median salaries, individual outcomes vary widely based on location, experience, school, and market conditions
"""


def run_agent(user_message: str, conversation_history: list[dict] | None = None) -> dict:
    """
    Run the agent loop:
    1. Send user message + tools to Claude
    2. If Claude wants to use a tool, execute it and send result back
    3. Repeat until Claude gives a final text response
    4. Return the response and updated conversation history
    """
    messages = list(conversation_history) if conversation_history else []
    messages.append({"role": "user", "content": user_message})

    while True:
        # Call Claude with our tools
        response = client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        # Check if Claude wants to use tools or is done
        if response.stop_reason == "tool_use":
            # Claude wants to call one or more tools.
            # The response content has both text blocks and tool_use blocks.
            # We need to execute each tool and send results back.

            # Add Claude's response (with tool_use blocks) to history
            messages.append({"role": "assistant", "content": response.content})

            # Execute each tool call and collect results
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    tool_name = block.name
                    tool_input = block.input
                    tool_id = block.id

                    # Look up and execute the tool
                    func = TOOL_DISPATCH.get(tool_name)
                    if func:
                        result = func(tool_input)
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": json.dumps(result, default=str),
                            }
                        )
                    else:
                        tool_results.append(
                            {
                                "type": "tool_result",
                                "tool_use_id": tool_id,
                                "content": f"Error: unknown tool '{tool_name}'",
                                "is_error": True,
                            }
                        )

            # Send tool results back to Claude so it can continue
            messages.append({"role": "user", "content": tool_results})

        else:
            # Claude is done (stop_reason == "end_turn"). Extract text response.
            text_response = ""
            for block in response.content:
                if hasattr(block, "text"):
                    text_response += block.text

            messages.append({"role": "assistant", "content": response.content})

            return {
                "response": text_response,
                "conversation_history": messages,
            }
