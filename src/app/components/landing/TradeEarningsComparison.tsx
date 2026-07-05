'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import * as CollegeConstants from '@/app/constants/college_related_constants'
import { InfoTooltip } from '../calculator/InfoTooltip'

// Career-length model matches the app's other lifetime-earnings view: a 45-year
// working life. Trades enter via paid apprenticeship and work all 45 years; a
// bachelor's student spends the first years in school and starts 4 years later.
const CAREER_YEARS = 45
const BACHELOR_SCHOOL_YEARS = parseFloat(CollegeConstants.BACHELOR_YEARS_IN_SCHOOL)
const BACHELOR_WORKING_YEARS = CAREER_YEARS - BACHELOR_SCHOOL_YEARS

// BLS 2024 median annual wage.
const ELECTRICIAN_SALARY = 61590
const CASHIER_SALARY = 29720

const HS_SALARY = CollegeConstants.HIGHSCHOOL_DIPLOMA_MEDIAN_SALARY
const GRAD_SALARY = CollegeConstants.BACHELOR_DEGREE_MEDIAN_SALARY

const compact = (v: number) => `$${(v / 1_000_000).toFixed(1)}M`
const full = (v: number) => `$${Math.round(v).toLocaleString()}`

interface Props {
  // Out-of-pocket cost of the degree (net price + 10-year loan interest),
  // subtracted from the bachelor's lifetime earnings. Opportunity cost is
  // already reflected in the reduced working years.
  degreeCost: number
}

export default function TradeEarningsComparison({ degreeCost }: Props) {
  const data = [
    {
      name: 'High School Diploma',
      salary: HS_SALARY,
      earnings: CAREER_YEARS * HS_SALARY,
      years: CAREER_YEARS,
      color: 'hsl(var(--chart-3))',
    },
    {
      name: 'Electrician',
      salary: ELECTRICIAN_SALARY,
      earnings: CAREER_YEARS * ELECTRICIAN_SALARY,
      years: CAREER_YEARS,
      color: 'hsl(var(--chart-2))',
    },
    {
      name: 'Cashier',
      salary: CASHIER_SALARY,
      earnings: CAREER_YEARS * CASHIER_SALARY,
      years: CAREER_YEARS,
      color: 'hsl(var(--chart-5))',
    },
    {
      name: "Bachelor's Degree",
      salary: GRAD_SALARY,
      earnings: BACHELOR_WORKING_YEARS * GRAD_SALARY - degreeCost,
      years: BACHELOR_WORKING_YEARS,
      color: 'hsl(var(--chart-1))',
    },
  ].sort((a, b) => a.earnings - b.earnings) // least to most

  return (
    <div className="space-y-3">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 24, right: 12, left: 8, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              interval={0}
              tickFormatter={(name: string) =>
                name === "Bachelor's Degree" ? "Bachelor's" : name === 'High School Diploma' ? 'HS Diploma' : name
              }
            />
            <YAxis tickFormatter={compact} width={48} tick={{ fontSize: 12 }} />
            <Tooltip
              formatter={((value: number, _name: string, entry: { payload?: { salary?: number; years?: number } }): [string, string] => [
                `${full(value)} lifetime`,
                `${full(entry?.payload?.salary ?? 0)}/yr median · ${entry?.payload?.years} working years`,
              ]) as never}
              labelFormatter={(label) => label}
              cursor={false}
            />
            <Bar dataKey="earnings" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
              <LabelList dataKey="earnings" position="top" formatter={compact} className="text-xs" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm text-muted-foreground">
          The path matters more than the diploma. Even after subtracting the cost of
          school (not the total repaid on a loan), a bachelor&apos;s still leads on the
          median — but a licensed electrician out-earns the typical high-school worker with
          no degree and little or no debt, while a minimum-wage service job like a cashier
          earns far less. &ldquo;No degree&rdquo; can mean very different things.
          <InfoTooltip content="Total nominal earnings over a 45-year working life (median annual wage × years worked, not adjusted for inflation or raises). Electricians and cashiers start working right away, so they work the full 45 years; a bachelor's graduate starts 4 years later after finishing school. The bachelor's bar is shown net of the median cost of school itself (net price after aid) — not the total repaid on a loan, which would be higher after interest. Salaries: U.S. Bureau of Labor Statistics; cost: College Scorecard." />
        </p>
    </div>
  )
}
