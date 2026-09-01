"""
Eval runner — loops dataset, runs each message through the agent, scores results.

Usage:
    cd api && ../evals/venv/bin/python -m evals.run        # run all
    cd api && ../evals/venv/bin/python -m evals.run --id happy-cs   # run one row
"""

import argparse
import asyncio
import json
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "api"))
sys.path.insert(0, str(PROJECT_ROOT))

from agent import run_agent
from evals.scorers import score


DATASET_PATH = Path(__file__).resolve().parent / "dataset.jsonl"


def load_dataset(filter_id: str | None = None) -> list[dict]:
    rows = []
    with open(DATASET_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if filter_id and row["id"] != filter_id:
                continue
            rows.append(row)
    return rows


async def run_one(row: dict) -> dict:
    start = time.time()
    result = await run_agent(row["user_message"])
    elapsed = time.time() - start

    scores = score(
        response=result["response"],
        conversation_history=result["conversation_history"],
        expected=row,
    )

    return {
        "id": row["id"],
        "user_message": row["user_message"],
        "response": result["response"],
        "scores": scores,
        "elapsed_s": round(elapsed, 2),
        "notes": row.get("notes", ""),
    }


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", help="Run a single row by id")
    args = parser.parse_args()

    dataset = load_dataset(args.id)
    if not dataset:
        print("No matching rows found.")
        return

    print(f"Running {len(dataset)} eval(s)...\n")

    results = []
    for row in dataset:
        print(f"  [{row['id']}] {row['user_message'][:60]}...", end=" ", flush=True)
        result = await run_one(row)
        results.append(result)

        all_pass = all(result["scores"].values())
        status = "PASS" if all_pass else "FAIL"
        print(f"{status} ({result['elapsed_s']}s)")

        if not all_pass:
            for scorer_name, passed in result["scores"].items():
                if not passed:
                    print(f"    x {scorer_name}")

    print("\n--- Summary ---")
    all_scorers: dict[str, list[bool]] = {}
    for r in results:
        for name, passed in r["scores"].items():
            all_scorers.setdefault(name, []).append(passed)

    for name, values in sorted(all_scorers.items()):
        passed = sum(values)
        total = len(values)
        pct = (passed / total) * 100 if total else 0
        print(f"  {name}: {passed}/{total} ({pct:.0f}%)")

    total_pass = sum(1 for r in results if all(r["scores"].values()))
    print(f"\n  Overall: {total_pass}/{len(results)} rows fully passing")

    results_dir = Path(__file__).resolve().parent / "results"
    results_dir.mkdir(exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    out_path = results_dir / f"{timestamp}.jsonl"
    with open(out_path, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    print(f"\n  Results written to {out_path}")


if __name__ == "__main__":
    asyncio.run(main())
