'use client'

import { useEffect, useMemo, useState } from 'react'
import { calculateTotalInterestPaid, calculateBreakEvenYears } from '../../utils'
import * as CollegeConstants from '@/app/constants/college_related_constants'
import { InfoTooltip } from '../calculator/InfoTooltip'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

interface TuitionMedian {
  cohort: string
  label: string
  sticker_annual: number | null
  net_price_annual: number | null
  cost_of_attendance_annual: number | null
  sample_size: number
  source: string
}

type Metric = 'net' | 'sticker'

// National medians (EducationData.org): the typical borrower owes ~$39k and
// takes ~20 years to repay. We default to these rather than an idealized
// "finance the full net price on a 10-year plan" — the point is to show the
// median, not the best case.
const MEDIAN_STUDENT_DEBT = 39000
const MEDIAN_REPAYMENT_YEARS = 20
const YEARS = parseFloat(CollegeConstants.BACHELOR_YEARS_IN_SCHOOL)
const HS_SALARY = CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY
const GRAD_SALARY = CollegeConstants.BACHELOR_DEGREE_MEDIAN_SALARY

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

export default function MedianPayoffWidget() {
  const [medians, setMedians] = useState<TuitionMedian[]>([])
  const [cohort, setCohort] = useState('public_in_state')
  const [metric, setMetric] = useState<Metric>('sticker')
  const [amountBorrowed, setAmountBorrowed] = useState(MEDIAN_STUDENT_DEBT)
  const [interestRate, setInterestRate] = useState(
    parseFloat(CollegeConstants.STUDENT_LOAN_INTEREST_RATE)
  )
  const [termYears, setTermYears] = useState(MEDIAN_REPAYMENT_YEARS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tuition-medians')
      .then((r) => r.json())
      .then((data: TuitionMedian[]) => {
        setMedians(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selected = medians.find((m) => m.cohort === cohort)

  // Out-of-state public has no net price in the Scorecard data — fall back to
  // sticker and tell the user.
  const netUnavailable = metric === 'net' && selected?.net_price_annual == null
  const annualCost = useMemo(() => {
    if (!selected) return 0
    if (metric === 'sticker' || netUnavailable) return selected.sticker_annual ?? 0
    return selected.net_price_annual ?? 0
  }, [selected, metric, netUnavailable])

  const totals = useMemo(() => {
    const tuition = annualCost * YEARS
    // Interest accrues on the amount actually borrowed (median debt by default),
    // not the full net price — aid, savings, and work cover part of the cost.
    const interest = calculateTotalInterestPaid(amountBorrowed, interestRate, termYears)
    const opportunity = HS_SALARY * YEARS
    const total = tuition + interest + opportunity
    const breakEven = calculateBreakEvenYears(total, GRAD_SALARY, HS_SALARY)
    return { tuition, interest, opportunity, total, breakEven }
  }, [annualCost, amountBorrowed, interestRate, termYears])

  const COHORT_ORDER = ['public_in_state', 'public_out_of_state', 'private_nonprofit']
  const ordered = COHORT_ORDER.map((c) => medians.find((m) => m.cohort === c)).filter(
    Boolean
  ) as TuitionMedian[]

  return (
    <div className="space-y-6">
        {/* Cohort selector */}
        <div>
          <div className="text-sm font-medium mb-2">School type</div>
          <div className="grid grid-cols-3 gap-2">
            {ordered.map((m) => (
              <Button
                key={m.cohort}
                variant={cohort === m.cohort ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCohort(m.cohort)}
                className="text-xs h-auto py-2 whitespace-normal"
              >
                {m.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Metric toggle + disclaimer */}
        <div>
          <div className="flex items-center gap-1 text-sm font-medium mb-2">
            Cost basis
            <InfoTooltip content="Sticker: tuition and fees before aid. Net price: total cost after average aid, what students actually pay." />
          </div>
          <div className="flex gap-2">
            <Button
              variant={metric === 'net' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('net')}
            >
              Net price
            </Button>
            <Button
              variant={metric === 'sticker' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMetric('sticker')}
            >
              Sticker
            </Button>
          </div>
          {netUnavailable && (
            <p className="text-xs text-muted-foreground mt-2">
              No net price for out-of-state students; showing sticker instead.
            </p>
          )}
        </div>

        {/* Amount borrowed slider */}
        <div>
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span className="flex items-center gap-1">
              Amount borrowed
              <InfoTooltip content="How much you finance with loans. Defaults to the ~$39,000 national median debt; most people borrow less than the full cost." />
            </span>
            <span className="tabular-nums">{fmt(amountBorrowed)}</span>
          </div>
          <Slider
            value={[amountBorrowed]}
            min={0}
            max={100000}
            step={1000}
            onValueChange={(v) => setAmountBorrowed(v[0])}
          />
        </div>

        {/* Interest slider */}
        <div>
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span>Loan interest rate</span>
            <span className="tabular-nums">{interestRate.toFixed(1)}%</span>
          </div>
          <Slider
            value={[interestRate]}
            min={0}
            max={15}
            step={0.5}
            onValueChange={(v) => setInterestRate(v[0])}
          />
        </div>

        {/* Repayment term slider */}
        <div>
          <div className="flex items-center justify-between text-sm font-medium mb-2">
            <span className="flex items-center gap-1">
              Repayment plan
              <InfoTooltip content="Years to repay. Defaults to the ~20-year national median. Longer terms lower monthly payments but cost more total interest." />
            </span>
            <span className="tabular-nums">{termYears} years</span>
          </div>
          <Slider
            value={[termYears]}
            min={10}
            max={30}
            step={1}
            onValueChange={(v) => setTermYears(v[0])}
          />
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-6">
            Loading median data…
          </div>
        ) : (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <Metric label="Tuition (4 yr)" value={fmt(totals.tuition)} />
              <Metric label="Interest" value={fmt(totals.interest)} />
              <Metric label="Opportunity" value={fmt(totals.opportunity)} />
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total cost of the degree</div>
              <div className="text-2xl font-bold">{fmt(totals.total)}</div>
            </div>
            <div className="text-center border-t pt-4">
              <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                Pay-off point
                <InfoTooltip content="Years for the higher bachelor's salary to offset the total cost, versus a high-school diploma." />
              </div>
              <div className="text-xl font-bold">
                {typeof totals.breakEven === 'number'
                  ? `${Math.round(totals.breakEven * 10) / 10} years`
                  : 'N/A'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Based on the {fmt(GRAD_SALARY)} national median bachelor&apos;s salary vs{' '}
                {fmt(HS_SALARY)} with only a high-school diploma.
              </div>
            </div>
          </div>
        )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  )
}
