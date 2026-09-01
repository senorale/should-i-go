export default function Footer() {
  return (
    <footer className="border-t bg-card px-4 py-6 text-xs text-muted-foreground">
      <div className="mx-auto max-w-4xl space-y-2">
        <p>
          Salary data from the{' '}
          <a
            href="https://www.bls.gov/oes/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            U.S. Bureau of Labor Statistics
          </a>{' '}
          Occupational Employment and Wage Statistics, May 2024.
        </p>
        <p>
          School cost figures from the{' '}
          <a
            href="https://collegescorecard.ed.gov/data/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            U.S. Department of Education College Scorecard
          </a>
          .
        </p>
        <p>
          This site incorporates information from{' '}
          <a
            href="https://services.onetcenter.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            O*NET Web Services
          </a>{' '}
          by the U.S. Department of Labor, Employment and Training
          Administration (USDOL/ETA).
        </p>
      </div>
    </footer>
  )
}
