# Eval Baseline — 2026-09-01

First full run with deterministic scorers + LLM-as-judge (DB awake).

## Deterministic Scorers

| Scorer | Pass | Total | Rate |
|--------|------|-------|------|
| link_present | 6 | 9 | 67% |
| link_uuids_grounded | 9 | 9 | 100% |
| no_unexpected_link | 6 | 6 | 100% |
| tool_called:find_majors | 8 | 9 | 89% |

Overall: 12/15 rows fully passing (80%)

## LLM-as-Judge Scores (Haiku, temperature=0)

| Judge | Mean Score | n |
|-------|-----------|---|
| faithfulness | 4.4/5 | 13 |
| helpfulness | 4.7/5 | 15 |
| bls_attribution | 3.4/5 | 15 |

Note: 2 faithfulness scores dropped due to judge JSON parse errors (Haiku returning unescaped commas in reason field).

## Key Findings

**BLS attribution is the weakest area (3.4/5).** Agent presents salary data without crediting BLS May 2024 source in ~60% of salary-bearing responses. System prompt requires it. Fix options: strengthen prompt language or add a guardrail.

**Faithfulness generally strong but agent invents "weighted averages."** Tool output returns per-occupation salaries. Agent sometimes computes or fabricates an average not present in the data. Score drops to 2-3 on those rows.

**Three failing rows:**
- `happy-engineering`: agent calls find_majors but doesn't include a /compare link.
- `happy-roi`: agent calls find_majors but doesn't include a /compare link.
- `trick-law`: agent doesn't call find_majors for "should I go to law school?" — answers from general knowledge instead of searching.

**link_uuids_grounded: 100%.** Agent never hallucinated a UUID. All compare links point to real majors from tool output.

## Notes

- Model: claude-haiku-4-5-20251001 for both agent and judges.
- Cost: ~$0.05 for full 15-row run (agent + 3 judges per row = 60 Haiku calls).
- Baseline file: `evals/results/baseline.jsonl`. Run `--diff` to compare future runs against it.
