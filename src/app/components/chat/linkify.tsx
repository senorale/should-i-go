import { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'

const COMPARE_REGEX = /\/compare\?\S+/g
const URL_REGEX = /(https?:\/\/\S+)/g

function linkifyUrls(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  URL_REGEX.lastIndex = 0
  while ((match = URL_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const url = match[0]
    parts.push(
      <a
        key={match.index}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="underline break-all"
      >
        {url}
      </a>
    )
    lastIndex = URL_REGEX.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts
}

export function linkify(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  COMPARE_REGEX.lastIndex = 0
  while ((match = COMPARE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(linkifyUrls(text.slice(lastIndex, match.index)))
    }
    parts.push(
      <a
        key={`compare-${match.index}`}
        href={match[0]}
        className="mt-2 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary no-underline hover:bg-primary/10 transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        See your Degree Payoff Comparison
      </a>
    )
    lastIndex = COMPARE_REGEX.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(linkifyUrls(text.slice(lastIndex)))
  }
  return parts
}
