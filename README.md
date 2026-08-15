# Should I Go?

A tool to help someone decide, on their own terms, whether college is worth it for them.

Beyond the sticker price, it factors in loan interest, opportunity cost (wages given up while in school), and expected post-degree earnings, then estimates how long the degree takes to pay for itself. It also surfaces non-degree paths (skilled trades, registered apprenticeships) so college is compared against real alternatives.

Live at [shouldigo.io](https://shouldigo.io).

## What's in the app

- **Landing page** with three collapsible cards:
  - *The short answer* — one-paragraph summary computed from the national medians in the database.
  - *Lifetime earnings comparison* — degree vs. trades earnings over a working life, factoring in years spent in school and degree cost.
  - *When does it pay off?* — median payoff widget across school cohorts (public in-state, public out-of-state, private nonprofit, all).
- **`/occupations`** — compare occupations using BLS wage data. Powered by the BLS Public Data API, proxied server-side so the API key stays on the server.
- **`/faq`** — assumptions, formulas, and data sources.
- **`/schools`** — placeholder for a Scorecard-powered school comparison; landing links out to the U.S. Dept. of Education College Scorecard in the meantime.

## Data sources

- **U.S. Dept. of Education College Scorecard** — `Most-Recent-Cohorts-Institution.csv`. Seeded into `TuitionMedian` by cohort (sticker price, net price, cost of attendance, sample size).
- **U.S. Bureau of Labor Statistics** — occupation categories and median annual wages. Seeded into `OccupationCategory` / `OccupationSubCategory` from CSV, then queried live via the BLS API proxy at `/api/bls`.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19
- Prisma 6 + PostgreSQL (Neon in prod)
- Tailwind + shadcn/ui (Radix primitives)
- Recharts 3 for the charts

## Getting started

Prereqs: Node 20+, a PostgreSQL instance, and a BLS API registration key ([register here](https://www.bls.gov/developers/)).

1. Clone and install:
   ```bash
   git clone https://github.com/mikebranc/should-i-go.git
   cd should-i-go
   npm install
   ```

2. Environment variables (`.env`):
   ```bash
   DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
   BLS_API_KEY="your_bls_registration_key"
   ```

3. Generate the Prisma client and run migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Seed the database:
   ```bash
   npm run create-db       # occupations from data/national_data.csv
   npm run seed-tuition    # tuition medians from data/Most-Recent-Cohorts-Institution.csv
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## The math

### Breakeven

The breakeven point is where cumulative earnings with a degree (minus its cost) catch up to cumulative earnings without one.

```
t * H = t * C - (T + I + O)
```

- `t` — years after finishing school
- `H` — annual salary with a high-school diploma
- `C` — annual salary with the degree
- `T` — total tuition
- `I` — total loan interest
- `O` — opportunity cost (`Y * H`, where `Y` is years in school)

Solving for `t`:

```
t = (T + I + O) / (C - H)
```

### Loan interest

Standard daily simple interest on a 10-year term, matching the default federal repayment plan.

### Opportunity cost

`years in school * annual salary you'd have earned with a high-school diploma`. Included in the total cost so the breakeven reflects real time-value, not just cash outlay.

### National medians

`H` and `C` default to national medians (BLS) via `src/app/constants/college_related_constants.ts`. Tuition figures come from College Scorecard medians, computed per cohort at seed time.

## Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npm run build` | Prisma generate + Next.js build |
| `npm run start` | Serve the production build |
| `npm run lint` | Next.js ESLint |
| `npm run create-db` | Seed `OccupationCategory` / `OccupationSubCategory` from `data/national_data.csv` |
| `npm run create-29` | Seed the 29 top-level occupation categories |
| `npm run seed-tuition` | Compute and seed `TuitionMedian` rows from the Scorecard CSV |

## Disclaimer

Estimates, not financial advice. The goal is to inform, not to sway. Talk to a financial professional for personalized guidance.
