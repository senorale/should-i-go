export default function Footer() {
  return (
    <footer className="border-t bg-card px-4 py-6 text-xs text-muted-foreground">
      <ul className="mx-auto max-w-4xl space-y-1">
        <li>
          Salaries:{' '}
          <a href="https://www.bls.gov/oes/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            U.S. Bureau of Labor Statistics
          </a>{' '}
          (May 2024)
        </li>
        <li>
          School costs, graduation rates, and program earnings:{' '}
          <a href="https://collegescorecard.ed.gov/data/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            U.S. Department of Education College Scorecard
          </a>
        </li>
        <li>
          Education requirements:{' '}
          <a href="https://services.onetcenter.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            O*NET Web Services
          </a>{' '}
          (USDOL/ETA)
        </li>
      </ul>
    </footer>
  )
}
