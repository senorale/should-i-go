"""
Eval runner — loops dataset, runs each message through the agent, scores results.
Always compares against baseline when one exists.

Usage:
    python -m evals.run                       # run all, diff against baseline
    python -m evals.run --id happy-cs         # run one row
    python -m evals.run --filter happy        # run rows tagged "happy"
    python -m evals.run --save-baseline       # run all + save as new baseline
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
from evals.judges import run_all_judges
from evals.db_wait import wait_for_db


DATASET_PATH = Path(__file__).resolve().parent / "dataset.jsonl"


def load_dataset(filter_id: str | None = None, filter_tag: str | None = None) -> list[dict]:
    rows = []
    with open(DATASET_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            if filter_id and row["id"] != filter_id:
                continue
            if filter_tag and filter_tag not in row.get("tags", []):
                continue
            rows.append(row)
    return rows


BASELINE_PATH = Path(__file__).resolve().parent / "baseline.jsonl"


def load_results_file(path: Path) -> dict[str, dict] | None:
    """Load a results JSONL file, keyed by row id."""
    if not path.exists():
        return None
    by_id = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            by_id[row["id"]] = row
    return by_id


def save_baseline(results: list[dict]):
    """Save current results as the baseline."""
    BASELINE_PATH.parent.mkdir(exist_ok=True)
    with open(BASELINE_PATH, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    print(f"\n  Baseline saved to {BASELINE_PATH}")


def print_diff(current: list[dict], previous: dict[str, dict]):
    """Show regressions and improvements vs baseline."""
    print("\n--- Diff vs Baseline ---")
    regressions = 0
    improvements = 0

    for result in current:
        row_id = result["id"]
        prev = previous.get(row_id)
        if not prev:
            print(f"  {row_id}: NEW (not in baseline)")
            continue

        for scorer, passed in result["scores"].items():
            prev_passed = prev.get("scores", {}).get(scorer)
            if prev_passed is None:
                continue
            if passed and not prev_passed:
                print(f"  {row_id}: {scorer} FIXED")
                improvements += 1
            elif not passed and prev_passed:
                print(f"  {row_id}: {scorer} REGRESSED")
                regressions += 1

        for judge_name, judge in result.get("judges", {}).items():
            prev_judge = prev.get("judges", {}).get(judge_name, {})
            prev_score = prev_judge.get("score", 0)
            curr_score = judge.get("score", 0)
            delta = curr_score - prev_score
            if delta != 0:
                direction = "+" if delta > 0 else ""
                label = "UP" if delta > 0 else "DOWN"
                print(f"  {row_id}: {judge_name} {prev_score} -> {curr_score} ({direction}{delta}) {label}")
                if delta > 0:
                    improvements += 1
                else:
                    regressions += 1

    print(f"\n  {improvements} improvement(s), {regressions} regression(s)")


async def run_one(row: dict) -> dict:
    start = time.time()
    result = await run_agent(row["user_message"])
    elapsed = time.time() - start

    scores = score(
        response=result["response"],
        conversation_history=result["conversation_history"],
        expected=row,
    )

    judge_results = await run_all_judges(
        user_message=row["user_message"],
        response=result["response"],
        conversation_history=result["conversation_history"],
    )

    return {
        "id": row["id"],
        "user_message": row["user_message"],
        "response": result["response"],
        "scores": scores,
        "judges": judge_results,
        "elapsed_s": round(elapsed, 2),
        "notes": row.get("notes", ""),
    }


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--id", help="Run a single row by id")
    parser.add_argument("--filter", help="Run rows matching a tag (e.g. --filter happy)")
    parser.add_argument("--save-baseline", action="store_true", help="Save this run as the new baseline")
    args = parser.parse_args()

    dataset = load_dataset(args.id, args.filter)
    if not dataset:
        print("No matching rows found.")
        return

    previous = load_results_file(BASELINE_PATH)

    wait_for_db()
    print(f"Running {len(dataset)} eval(s)...\n")

    results = []
    for row in dataset:
        print(f"  [{row['id']}] {row['user_message'][:60]}...", end=" ", flush=True)
        result = await run_one(row)
        results.append(result)

        all_pass = all(result["scores"].values())
        status = "PASS" if all_pass else "FAIL"
        judge_summary = " | ".join(
            f"{name}={j['score']}" for name, j in result["judges"].items()
        )
        print(f"{status} ({result['elapsed_s']}s) [{judge_summary}]")

        if not all_pass:
            for scorer_name, passed in result["scores"].items():
                if not passed:
                    print(f"    x {scorer_name}")

        for name, j in result["judges"].items():
            if j["score"] <= 3:
                print(f"    ! {name}: {j['score']}/5 — {j['reason']}")

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

    print("\n--- Judge Scores ---")
    all_judges: dict[str, list[int]] = {}
    for r in results:
        for name, j in r.get("judges", {}).items():
            all_judges.setdefault(name, []).append(j["score"])

    for name, values in sorted(all_judges.items()):
        valid = [v for v in values if v > 0]
        if valid:
            mean = sum(valid) / len(valid)
            print(f"  {name}: {mean:.1f}/5 (n={len(valid)})")
        else:
            print(f"  {name}: no valid scores")

    results_dir = Path(__file__).resolve().parent / "results"
    results_dir.mkdir(exist_ok=True)
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    out_path = results_dir / f"{timestamp}.jsonl"
    with open(out_path, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")
    print(f"\n  Results written to {out_path}")

    if args.save_baseline:
        save_baseline(results)

    if previous:
        print_diff(results, previous)
    else:
        print("\n  No baseline found. Run with --save-baseline to create one.")


if __name__ == "__main__":
    asyncio.run(main())
