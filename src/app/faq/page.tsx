import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'FAQ · Should I Go To School?',
}

const faqs: { q: string; a: ReactNode }[] = [
  {
    q: 'What is this tool for?',
    a: (
      <>
        It helps you make an informed decision about whether — and where — to go to
        college, by putting real numbers on the trade-off between what you pay and what
        you can expect to earn. It is not here to push you toward or away from college;
        for many people a skilled trade or apprenticeship is the better answer.
      </>
    ),
  },
  {
    q: 'Why do you use the median instead of the average?',
    a: (
      <>
        The <span className="font-medium text-foreground">median</span> is the middle
        value — half of people earn more and half earn less. The{' '}
        <span className="font-medium text-foreground">average</span> (mean) gets pulled
        upward by a small number of very high earners or very expensive schools, so it
        overstates what a typical person actually experiences. Salaries and school costs
        are skewed that way, so the median is the more honest picture of the &ldquo;typical&rdquo;
        outcome — which is why every figure on this site is a median.
      </>
    ),
  },
  {
    q: 'Where does the data come from?',
    a: (
      <>
        Salary figures are 2024 median annual wages from the{' '}
        <a
          href="https://www.bls.gov/oes/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          U.S. Bureau of Labor Statistics
        </a>
        . School cost figures (tuition, net price, and cost of attendance) come from the{' '}
        <a
          href="https://collegescorecard.ed.gov/data/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          U.S. Department of Education College Scorecard
        </a>
        .
      </>
    ),
  },
  {
    q: 'How is the break-even point calculated?',
    a: (
      <>
        We add up the total cost of the degree — tuition (or net price), the interest on
        a student loan, and the opportunity cost of the wages you give up while studying —
        then divide it by how much more a graduate earns each year versus someone with
        only a high-school diploma. The result is the number of years it takes for the
        higher salary to pay back the full investment.
      </>
    ),
  },
  {
    q: "What's the difference between sticker price and net price?",
    a: (
      <>
        <span className="font-medium text-foreground">Sticker price</span> is the
        published tuition and fees, before any aid.{' '}
        <span className="font-medium text-foreground">Net price</span> is the full cost of
        attendance minus the average grant and scholarship aid — what students actually
        pay. Private schools often show a high sticker but a much lower net price because
        of heavy scholarship discounting, while public schools discount less.
      </>
    ),
  },
  {
    q: 'What loan interest rate and repayment plan do you assume?',
    a: (
      <>
        By default we use an illustrative 8% rate on a standard 10-year repayment plan,
        which keeps total interest lowest. Real federal rates change yearly, and
        income-driven plans — or unpaid interest capitalizing onto the principal — can
        stretch repayment and total interest well beyond 10 years. In practice the average
        borrower owes about $39,000 and takes up to 20 years to repay, with a typical
        payment of $200–$299/month (
        <a
          href="https://educationdata.org/student-loan-debt-statistics"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          EducationData.org
        </a>
        ). Check your specific terms at{' '}
        <a
          href="https://studentaid.gov/understand-aid/types/loans/interest-rates"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          StudentAid.gov
        </a>
        .
      </>
    ),
  },
  {
    q: "Isn't college the only path to a good career?",
    a: (
      <>
        No. Many well-paying careers don&apos;t require a degree — skilled trades like
        electricians and plumbers, and other roles filled through{' '}
        <a
          href="https://www.apprenticeship.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          registered apprenticeships
        </a>{' '}
        that pay you a wage while you learn, with little or no debt. That said, &ldquo;no
        degree&rdquo; covers a wide range: a licensed electrician earns far more than a
        minimum-wage service job.
      </>
    ),
  },
  {
    q: 'Is this financial advice?',
    a: (
      <>
        No. These are estimates based on median, nation-wide figures and simplifying
        assumptions. Your own costs, aid, salary, and repayment terms will differ. Use
        this as a starting point for your own research, not as a guarantee.
      </>
    ),
  },
]

export default function FaqPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2">
          <Link href="/" className="text-sm text-primary hover:underline">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Frequently asked questions</h1>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }) => (
            <details key={q} className="group rounded-lg border bg-card p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</div>
            </details>
          ))}
        </div>
      </div>
    </main>
  )
}
