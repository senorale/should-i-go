'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { X, Search } from 'lucide-react'
import { calculateTotalInterestPaid, calculateBreakEvenYears } from '../utils'
import * as C from '@/app/constants/college_related_constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Occupation {
  id: string
  name: string
  annual_salary: number
}

type Mode = 'compare' | 'breakeven'

const MAX_OCCUPATIONS = 5
const MEDIAN_DEBT = 39000
const MEDIAN_TERM_YEARS = 20
const DEFAULT_RATE = parseFloat(C.STUDENT_LOAN_INTEREST_RATE)
const DEFAULT_YEARS = parseFloat(C.BACHELOR_YEARS_IN_SCHOOL)
const DEFAULT_HS_SALARY = C.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`
const num = (s: string) => {
  const n = parseFloat(s)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export default function CompareOccupations() {
  const [mode, setMode] = useState<Mode>('compare')
  const [all, setAll] = useState<Occupation[]>([])
  const [selected, setSelected] = useState<Occupation[]>([])
  const [query, setQuery] = useState('')

  // Editable break-even inputs (strings so the fields can be cleared/typed).
  const [costOfSchool, setCostOfSchool] = useState('')
  const [amountBorrowed, setAmountBorrowed] = useState(String(MEDIAN_DEBT))
  const [rate, setRate] = useState(String(DEFAULT_RATE))
  const [term, setTerm] = useState(String(MEDIAN_TERM_YEARS))
  const [years, setYears] = useState(String(DEFAULT_YEARS))
  const [hsSalary, setHsSalary] = useState(String(DEFAULT_HS_SALARY))

  useEffect(() => {
    fetch('/api/occupations/subcategories')
      .then((r) => r.json())
      .then((data: Occupation[]) => setAll(data))
      .catch(() => {})
    // Default cost of school to the median in-state public net price × years.
    fetch('/api/tuition-medians')
      .then((r) => r.json())
      .then((meds: { cohort: string; net_price_annual: number | null; sticker_annual: number | null }[]) => {
        const inState = meds.find((m) => m.cohort === 'public_in_state')
        const annual = inState?.net_price_annual ?? inState?.sticker_annual
        if (annual) setCostOfSchool(String(annual * DEFAULT_YEARS))
      })
      .catch(() => {})
  }, [])

  const searchResults = useMemo(() => {
    if (query.trim().length < 2) return []
    const q = query.toLowerCase()
    return all
      .filter((o) => o.name.toLowerCase().includes(q) && !selected.some((s) => s.id === o.id))
      .slice(0, 8)
  }, [query, all, selected])

  const addOccupation = (o: Occupation) => {
    if (selected.length < MAX_OCCUPATIONS) {
      setSelected((prev) => [...prev, o])
      setQuery('')
    }
  }
  const removeOccupation = (id: string) => setSelected((prev) => prev.filter((s) => s.id !== id))

  const investment = useMemo(() => {
    const school = num(costOfSchool)
    const interest = calculateTotalInterestPaid(num(amountBorrowed), num(rate), num(term))
    const opportunity = num(hsSalary) * num(years)
    return { school, interest, opportunity, total: school + interest + opportunity }
  }, [costOfSchool, amountBorrowed, rate, term, years, hsSalary])

  const atMax = selected.length >= MAX_OCCUPATIONS
  const maxSalary = Math.max(1, ...selected.map((o) => o.annual_salary))

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Compare occupations</h1>
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/50 p-1">
          <ModeButton active={mode === 'compare'} onClick={() => setMode('compare')}>
            Compare salaries
          </ModeButton>
          <ModeButton active={mode === 'breakeven'} onClick={() => setMode('breakeven')}>
            Will it pay off?
          </ModeButton>
        </div>

        {/* Occupation picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Pick occupations{' '}
              <span className="text-sm font-normal text-muted-foreground">
                ({selected.length}/{MAX_OCCUPATIONS})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={atMax ? 'Remove one to add another' : 'Search occupations…'}
                disabled={atMax}
                className="pl-9"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                  {searchResults.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => addOccupation(o)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <span className="truncate pr-2">{o.name}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">
                        {fmt(o.annual_salary)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((o, i) => (
                  <span
                    key={o.id}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm"
                    style={{ borderColor: COLORS[i % COLORS.length] }}
                  >
                    {o.name}
                    <button
                      onClick={() => removeOccupation(o.id)}
                      aria-label={`Remove ${o.name}`}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Search and add up to {MAX_OCCUPATIONS} occupations to compare.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Break-even inputs */}
        {mode === 'breakeven' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your numbers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Prefilled with national medians. Edit any to match your situation.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Cost of school ($)" value={costOfSchool} onChange={setCostOfSchool} />
                <Field label="Years in school" value={years} onChange={setYears} />
                <Field label="Amount borrowed ($)" value={amountBorrowed} onChange={setAmountBorrowed} />
                <Field label="Loan interest rate (%)" value={rate} onChange={setRate} step="0.1" />
                <Field label="Repayment plan (years)" value={term} onChange={setTerm} />
                <Field label="Salary without degree ($)" value={hsSalary} onChange={setHsSalary} />
              </div>
              <div className="grid grid-cols-3 gap-3 border-t pt-4 text-center">
                <Stat label="Cost of school" value={fmt(investment.school)} />
                <Stat label="Loan interest" value={fmt(investment.interest)} />
                <Stat label="Opportunity" value={fmt(investment.opportunity)} />
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Total investment</div>
                <div className="text-2xl font-bold">{fmt(investment.total)}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {selected.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {mode === 'compare' ? 'National median annual salary' : 'Years to pay off'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mode === 'compare'
                ? [...selected]
                    .sort((a, b) => b.annual_salary - a.annual_salary)
                    .map((o, i) => (
                      <div key={o.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="truncate pr-2">{o.name}</span>
                          <span className="shrink-0 font-semibold tabular-nums">
                            {fmt(o.annual_salary)}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(o.annual_salary / maxSalary) * 100}%`,
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))
                : [...selected]
                    .map((o) => ({
                      o,
                      be: calculateBreakEvenYears(investment.total, o.annual_salary, num(hsSalary)),
                    }))
                    .sort((a, b) => {
                      const av = typeof a.be === 'number' ? a.be : Infinity
                      const bv = typeof b.be === 'number' ? b.be : Infinity
                      return av - bv
                    })
                    .map(({ o, be }) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                      >
                        <div className="pr-2">
                          <div className="truncate text-sm font-medium">{o.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {fmt(o.annual_salary)}/yr
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          {typeof be === 'number' ? (
                            <span className="text-lg font-bold">
                              {Math.round(be * 10) / 10} yrs
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Pays ≤ no-degree salary
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Curious how these numbers are calculated?{' '}
          <Link href="/faq" className="text-primary hover:underline">
            Read the FAQ →
          </Link>
        </p>
      </div>
    </main>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  step,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  step?: string
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}
