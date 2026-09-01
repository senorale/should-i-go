"""
Galileo eval integration — runs the same dataset through run_experiment
with built-in Galileo metrics + custom scorers matching our hand-rolled ones.

Usage:
    python -m evals.galileo_eval                # run all
    python -m evals.galileo_eval --id happy-cs  # run one row
"""

import argparse
import asyncio
import json
import os
import re
import sys
from pathlib import Path

from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "api"))
sys.path.insert(0, str(PROJECT_ROOT))

from galileo import galileo_context
from galileo.experiments import run_experiment, LocalMetricConfig
from galileo.resources.models.document import Document

from agent import run_agent
from evals.run import load_dataset
from evals.db_wait import wait_for_db

COMPARE_LINK_RE = re.compile(r"/compare\?majorId=([0-9a-f-]{36})")


def link_present_scorer(step):
    """Custom scorer: does the response contain a /compare?majorId=UUID link?"""
    output = step.output or ""
    return 1.0 if COMPARE_LINK_RE.search(str(output)) else 0.0


def bls_attribution_scorer(step):
    """Custom scorer: does the response credit BLS when presenting salary data?"""
    output = str(step.output or "").lower()
    has_salary = "$" in output or "salary" in output or ",000" in output
    if not has_salary:
        return 1.0
    has_bls = "bls" in output or "bureau of labor" in output
    return 1.0 if has_bls else 0.0


def response_length_scorer(step):
    """Custom scorer: is the response under 800 chars?"""
    output = step.output or ""
    return 1.0 if len(str(output)) <= 800 else 0.0


def _extract_tool_outputs(history: list[dict]) -> list[str]:
    """Pull tool result content from conversation history."""
    outputs = []
    for msg in history:
        if msg.get("role") != "user":
            continue
        content = msg.get("content", [])
        if not isinstance(content, list):
            continue
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_result":
                raw = block.get("content", "")
                if raw and not block.get("is_error"):
                    outputs.append(raw)
    return outputs


def agent_function(input_data):
    """Wrapper to run our agent synchronously for Galileo's run_experiment."""
    user_message = input_data if isinstance(input_data, str) else input_data.get("input", "")

    result = asyncio.run(run_agent(user_message))
    response = result["response"]
    history = result["conversation_history"]

    tool_outputs = _extract_tool_outputs(history)

    logger = galileo_context.get_logger_instance()
    if logger and tool_outputs:
        docs = [Document(content=output) for output in tool_outputs]
        logger.add_retriever_span(
            input=user_message,
            output=docs,
            name="tool_results_as_context",
        )

    return response


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", help="Run a single row by id")
    parser.add_argument("--filter", help="Run rows matching a tag")
    args = parser.parse_args()

    rows = load_dataset(args.id, args.filter if hasattr(args, 'filter') else None)
    if not rows:
        print("No matching rows found.")
        return

    dataset = [{"input": row["user_message"]} for row in rows]

    custom_metrics = [
        LocalMetricConfig(name="link_present", scorer_fn=link_present_scorer),
        LocalMetricConfig(name="bls_attribution", scorer_fn=bls_attribution_scorer),
        LocalMetricConfig(name="response_length_ok", scorer_fn=response_length_scorer),
    ]

    wait_for_db()
    print(f"Running {len(dataset)} eval(s) through Galileo...\n")

    results = run_experiment(
        "should-i-go-evals",
        dataset=dataset,
        function=agent_function,
        experiment_group="should-i-go-eval-runs",
        metrics=[
            "context_adherence",
            "completeness",
            "tool_selection_quality",
            "tool_error_rate",
            "input_toxicity",
            "output_toxicity",
            "prompt_injection",
            "correctness",
            *custom_metrics,
        ],
        project=os.environ.get("GALILEO_PROJECT", "should-i-go"),
    )

    print("\nGalileo Experiment Results:")
    print(results.get("link", "No link returned"))


if __name__ == "__main__":
    main()
