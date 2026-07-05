import Link from 'next/link'

// Placeholder — the "compare up to 5 schools on graduation rate, average annual
// cost, and median earnings" tool (College Scorecard) is built in a later step.
export default function SchoolsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-2xl space-y-4">
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Compare schools</h1>
        <p className="text-muted-foreground">
          Coming soon: search and compare up to 5 schools on graduation rate, average
          annual cost, and median earnings, powered by the U.S. Department of Education
          College Scorecard.
        </p>
        <p className="text-muted-foreground">
          In the meantime, you can compare schools directly on the{' '}
          <a
            href="https://collegescorecard.ed.gov/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            College Scorecard
          </a>
          .
        </p>
      </div>
    </main>
  )
}
