import Link from 'next/link'
import { Compass, Bot } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 md:p-16">
      <div className="w-full max-w-xl space-y-10 text-center">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Should I go to college?
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose how you want to explore the answer.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/explore"
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border p-8 transition-all hover:border-primary hover:shadow-md"
          >
            <Compass className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="space-y-1">
              <span className="text-lg font-semibold">Explore on my own</span>
              <p className="text-sm text-muted-foreground">
                Browse majors, compare salaries, and run the payoff calculator at your own pace.
              </p>
            </div>
          </Link>

          <Link
            href="/chat"
            className="group flex flex-col items-center gap-4 rounded-xl border-2 border-border p-8 transition-all hover:border-primary hover:shadow-md"
          >
            <Bot className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="space-y-1">
              <span className="text-lg font-semibold">Counselor Agent</span>
              <p className="text-sm text-muted-foreground">
                Tell our AI counselor about your situation and get personalized guidance.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
