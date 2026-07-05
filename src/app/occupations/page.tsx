import Link from 'next/link'
import SchoolCostCalculator from '../components/calculator/SchoolCostCalculator'

// NOTE: temporary placeholder — this currently renders the original single-scenario
// calculator. It will be rebuilt into the "one school + up to 5 occupations" compare
// tool in the next step.
export default function OccupationsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-2xl space-y-4">
        <Link href="/" className="text-sm text-blue-500 hover:underline">
          ← Back
        </Link>
        <SchoolCostCalculator />
      </div>
    </main>
  )
}
