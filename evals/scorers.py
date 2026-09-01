"""
Deterministic eval scorers — no LLM needed.

Focused on the three things that matter right now:
1. Did the agent call find_majors when it should have?
2. Does the /compare link use a real UUID from the tool result?
3. Is the response grounded in tool output (no hallucinated UUIDs)?
"""

import re
from uuid import UUID


COMPARE_LINK_RE = re.compile(r"/compare\?majorId=([0-9a-f-]{36})")


def tool_called(conversation_history: list[dict], tool_name: str) -> bool:
    """Check whether a specific tool was called during the agent turn."""
    for msg in conversation_history:
        if msg.get("role") != "assistant":
            continue
        content = msg.get("content", [])
        if not isinstance(content, list):
            continue
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_use" and block.get("name") == tool_name:
                return True
    return False


def link_present(response: str) -> bool:
    """Check whether the response contains a /compare?majorId=UUID link."""
    return bool(COMPARE_LINK_RE.search(response))


def extract_link_uuids(response: str) -> list[str]:
    """Pull all majorId UUIDs out of /compare links in the response."""
    return COMPARE_LINK_RE.findall(response)


def extract_tool_result_uuids(conversation_history: list[dict]) -> set[str]:
    """Collect all major_id UUIDs that appeared in tool results."""
    import json
    uuids = set()
    for msg in conversation_history:
        if msg.get("role") != "user":
            continue
        content = msg.get("content", [])
        if not isinstance(content, list):
            continue
        for block in content:
            if not isinstance(block, dict) or block.get("type") != "tool_result":
                continue
            raw = block.get("content", "")
            try:
                data = json.loads(raw)
            except (json.JSONDecodeError, TypeError):
                continue
            if isinstance(data, list):
                for item in data:
                    mid = item.get("major_id", "")
                    if mid:
                        uuids.add(str(mid))
                    for rm in item.get("related_majors", []):
                        rmid = rm.get("major_id", "")
                        if rmid:
                            uuids.add(str(rmid))
    return uuids


def link_uuids_grounded(response: str, conversation_history: list[dict]) -> bool:
    """Every UUID in a /compare link must come from a tool result — not hallucinated."""
    response_uuids = extract_link_uuids(response)
    if not response_uuids:
        return True
    tool_uuids = extract_tool_result_uuids(conversation_history)
    return all(uid in tool_uuids for uid in response_uuids)


def score(response: str, conversation_history: list[dict], expected: dict) -> dict:
    """Run all scorers against one eval row. Returns a dict of scorer_name -> pass/fail."""
    results = {}

    expected_tools = expected.get("expected_tool_calls", [])
    for tool_name in expected_tools:
        results[f"tool_called:{tool_name}"] = tool_called(conversation_history, tool_name)

    if expected.get("expect_link"):
        results["link_present"] = link_present(response)
        results["link_uuids_grounded"] = link_uuids_grounded(response, conversation_history)
    else:
        if link_present(response):
            results["no_unexpected_link"] = False
        else:
            results["no_unexpected_link"] = True

    return results
