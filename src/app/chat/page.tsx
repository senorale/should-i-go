'use client'

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react'
import { Send, RotateCcw, ArrowRight, ArrowLeft, ChevronDown, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { linkify } from '@/app/components/chat/linkify'
import DataDisplay from '@/app/components/chat/DataDisplay'

// ---------------------------------------------------------------------------
// Decision tree intake
// ---------------------------------------------------------------------------

interface IntakeStep {
  key: string
  question: string
  subtitle: string
  options?: string[]
  placeholder: string
}

const SEGMENT_STEP: IntakeStep = {
  key: 'segment',
  question: "Which best describes you?",
  subtitle: "This helps me give you the right advice.",
  options: [
    "I'm considering whether to go to college",
    "I'm in college, picking or changing my major",
    "Not in school, exploring careers",
  ],
  placeholder: "",
}

const SCHOOL_APPROACH_STEP: IntakeStep = {
  key: 'school_approach',
  question: "Do you have specific schools in mind?",
  subtitle: "I can look up real costs and outcomes for any school.",
  options: [
    "Yes, I have schools I want to compare",
    "I want to explore schools in a specific state",
    "No, just give me general cost info",
  ],
  placeholder: "Or tell me about your school plans...",
}

const TARGET_SCHOOLS_STEP: IntakeStep = {
  key: 'target_schools',
  question: "Which schools are you considering?",
  subtitle: "I'll pull up tuition, graduation rates, debt, and earnings for each one.",
  placeholder: "e.g. University of Florida, Georgia Tech, NYU...",
}

const TARGET_STATE_STEP: IntakeStep = {
  key: 'target_state',
  question: "Which state?",
  subtitle: "I'll show you schools there with costs and outcomes.",
  placeholder: "e.g. Florida, California, New York...",
}

const INTERESTS_STEP: IntakeStep = {
  key: 'interests',
  question: "What fields interest you?",
  subtitle: "Majors, careers, industries, or subjects you enjoy.",
  placeholder: "e.g. computer science, nursing, business, engineering...",
}

const CURRENT_MAJOR_STEP: IntakeStep = {
  key: 'current_major',
  question: "What's your current major?",
  subtitle: "I'll look up career outcomes for your field.",
  placeholder: "e.g. biology, English, mechanical engineering...",
}

const CHANGE_REASON_STEP: IntakeStep = {
  key: 'change_reason',
  question: "What's driving the change?",
  subtitle: "This helps me suggest the right alternatives.",
  options: [
    "Not enjoying my current major",
    "Worried about job prospects after graduation",
    "Want higher earning potential",
    "Considering dropping out entirely",
  ],
  placeholder: "Or explain in your own words...",
}

const HAS_DEGREE_STEP: IntakeStep = {
  key: 'has_degree',
  question: "Do you have a college degree?",
  subtitle: "This shapes what data I can pull for you.",
  options: [
    "Yes",
    "No, I never went to college",
    "Some college, no degree",
  ],
  placeholder: "",
}

const MAJOR_STUDIED_STEP: IntakeStep = {
  key: 'major_studied',
  question: "What did you major in?",
  subtitle: "I'll pull up salary data and career paths for your degree.",
  placeholder: "e.g. psychology, finance, computer science...",
}

const CAREER_DIRECTION_STEP: IntakeStep = {
  key: 'career_direction',
  question: "Are you looking at careers related to your major?",
  subtitle: "This helps me know whether to focus on your degree's paths or explore new ones.",
  options: [
    "Yes, careers in my field",
    "No, I want to explore something different",
    "Not sure, show me both",
  ],
  placeholder: "",
}

const PRIORITY_STEP: IntakeStep = {
  key: 'priority',
  question: "What matters most to you?",
  subtitle: "Pick what drives your decision, or tell me in your own words.",
  options: [
    "Earning potential and salary",
    "Many career options from one major",
    "Minimizing debt",
    "Finishing school quickly",
  ],
  placeholder: "Or tell me what matters most...",
}

const FINANCES_DEEP_DIVE_STEP: IntakeStep = {
  key: 'finances_deep_dive',
  question: "Want a detailed financial breakdown?",
  subtitle: "I can walk through total debt, interest rates, repayment plans, monthly payments, and how they all affect the true cost of a degree.",
  options: [
    "Yes, walk me through the full financial picture",
    "No, just the big numbers",
  ],
  placeholder: "Or tell me what financial details you care about...",
}

const CAREER_PRIORITY_STEP: IntakeStep = {
  key: 'career_priority',
  question: "What matters most to you right now?",
  subtitle: "This shapes what I focus on.",
  options: [
    "Highest paying careers I can reach",
    "Careers I can switch to without more school",
    "Whether going back to school is worth it",
  ],
  placeholder: "Or tell me what matters most...",
}

const SCHOOL_TYPE_STEP: IntakeStep = {
  key: 'school_type',
  question: "What type of school?",
  subtitle: "This narrows the search to schools that fit.",
  options: [
    "Public universities",
    "Private nonprofit",
    "Either, show me both",
  ],
  placeholder: "",
}

const BUDGET_STEP: IntakeStep = {
  key: 'budget',
  question: "What's your annual budget for tuition?",
  subtitle: "I'll filter out schools that cost more than this after financial aid.",
  options: [
    "Under $10,000/yr",
    "Under $20,000/yr",
    "Under $40,000/yr",
    "No limit, show me everything",
  ],
  placeholder: "Or enter a specific amount...",
}

const SCHOOL_SIZE_STEP: IntakeStep = {
  key: 'school_size',
  question: "What size school do you prefer?",
  subtitle: "Student body size affects class sizes, campus feel, and resources.",
  options: [
    "Small (under 5,000 students)",
    "Medium (5,000–15,000)",
    "Large (15,000+)",
    "No preference",
  ],
  placeholder: "",
}

const SORT_PREFERENCE_STEP: IntakeStep = {
  key: 'sort_preference',
  question: "How should I rank schools for you?",
  subtitle: "Pick the metric that matters most.",
  options: [
    "Highest earnings after graduation",
    "Highest graduation rate",
    "Lowest net price",
    "Lowest student debt",
  ],
  placeholder: "",
}

const TRADE_INTEREST_STEP: IntakeStep = {
  key: 'trade_interest',
  question: "Are you considering alternatives to college?",
  subtitle: "Trades and apprenticeships are valid paths worth comparing.",
  options: [
    "Yes, interested in trades or apprenticeships",
    "Maybe, I want to compare all options",
    "No, just want to see if a degree is worth the cost",
  ],
  placeholder: "Or tell me what you're thinking...",
}

function getNextStep(answers: Record<string, string>): IntakeStep | null {
  const keys = Object.keys(answers)
  const segment = answers.segment?.toLowerCase() ?? ''

  if (!keys.includes('segment')) return SEGMENT_STEP

  const isConsidering = segment.includes('considering whether')
  const isInCollege = segment.includes('in college')
  const isNotInSchool = segment.includes('not in school')

  // --- Segment 1: Considering college ---
  if (isConsidering) {
    if (!keys.includes('school_approach')) return SCHOOL_APPROACH_STEP
    const approach = answers.school_approach?.toLowerCase() ?? ''
    if (approach.includes('schools i want to compare') && !keys.includes('target_schools')) return TARGET_SCHOOLS_STEP
    if (approach.includes('specific state') && !keys.includes('target_state')) return TARGET_STATE_STEP
    const wantsSchoolSearch = !approach.includes('general')
    if (wantsSchoolSearch && !keys.includes('school_type')) return SCHOOL_TYPE_STEP
    if (wantsSchoolSearch && !keys.includes('school_size')) return SCHOOL_SIZE_STEP
    if (wantsSchoolSearch && !keys.includes('budget')) return BUDGET_STEP
    if (wantsSchoolSearch && !keys.includes('sort_preference')) return SORT_PREFERENCE_STEP
    if (!keys.includes('interests')) return INTERESTS_STEP
    if (!keys.includes('trade_interest')) return TRADE_INTEREST_STEP
    if (!keys.includes('priority')) return PRIORITY_STEP
    if (!keys.includes('finances_deep_dive')) return FINANCES_DEEP_DIVE_STEP
    return null
  }

  // --- Segment 2: In college ---
  if (isInCollege) {
    if (!keys.includes('current_major')) return CURRENT_MAJOR_STEP
    if (!keys.includes('change_reason')) return CHANGE_REASON_STEP
    const isDroppingOut = (answers.change_reason ?? '').toLowerCase().includes('dropping out')
    if (!isDroppingOut && !keys.includes('interests')) return INTERESTS_STEP
    if (!keys.includes('priority')) return PRIORITY_STEP
    return null
  }

  // --- Segment 3: Not in school ---
  if (isNotInSchool) {
    if (!keys.includes('has_degree')) return HAS_DEGREE_STEP
    const hasDegree = answers.has_degree?.toLowerCase().startsWith('yes')
    if (hasDegree && !keys.includes('major_studied')) return MAJOR_STUDIED_STEP
    if (hasDegree && !keys.includes('career_direction')) return CAREER_DIRECTION_STEP
    const stayingInField = answers.career_direction?.toLowerCase().includes('in my field')
    if (!stayingInField && !keys.includes('interests')) return INTERESTS_STEP
    if (!keys.includes('career_priority')) return CAREER_PRIORITY_STEP
    if (hasDegree && !keys.includes('finances_deep_dive')) return FINANCES_DEEP_DIVE_STEP
    return null
  }

  // Freeform segment answer: ask interests then priority
  if (!keys.includes('interests')) return INTERESTS_STEP
  if (!keys.includes('priority')) return PRIORITY_STEP
  return null
}

function estimateTotalSteps(answers: Record<string, string>): number {
  const segment = answers.segment?.toLowerCase() ?? ''
  if (segment.includes('in college')) {
    const isDroppingOut = (answers.change_reason ?? '').toLowerCase().includes('dropping out')
    return isDroppingOut ? 4 : 5
  }
  if (segment.includes('not in school')) {
    const hasDegree = answers.has_degree?.toLowerCase().startsWith('yes')
    if (!hasDegree) return 4
    const stayingInField = answers.career_direction?.toLowerCase().includes('in my field')
    return stayingInField ? 6 : 7
  }

  if (segment.includes('considering whether')) {
    const approach = answers.school_approach?.toLowerCase() ?? ''
    if (approach.includes('general')) return 5
    return 10
  }
  return 5
}

// ---------------------------------------------------------------------------
// Intake phase UI
// ---------------------------------------------------------------------------

function IntakeFlow({ onComplete }: { onComplete: (answers: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<string[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const current = getNextStep(answers)
  const answeredCount = Object.keys(answers).length
  const totalEstimate = estimateTotalSteps(answers)
  const progress = current ? (answeredCount / totalEstimate) * 100 : 100

  useEffect(() => {
    inputRef.current?.focus()
  }, [answeredCount])

  function submit(value: string) {
    const trimmed = value.trim()
    if (!trimmed || !current) return
    const next = { ...answers, [current.key]: trimmed }
    setHistory((prev) => [...prev, current.key])
    setAnswers(next)
    setInput('')
    if (!getNextStep(next)) {
      onComplete(next)
    }
  }

  function goBack() {
    if (history.length === 0) return
    const lastKey = history[history.length - 1]
    setHistory((prev) => prev.slice(0, -1))
    setAnswers((prev) => {
      const next = { ...prev }
      delete next[lastKey]
      return next
    })
    setInput('')
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault()
    submit(input)
  }

  if (!current) return null

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {history.length > 0 ? (
            <button onClick={goBack} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : (
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <span className="text-sm font-medium text-foreground">Counselor Agent</span>
          <div className="w-5" />
        </div>
        {/* Progress bar */}
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="h-1 w-full rounded-full bg-secondary">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {current.question}
            </h1>
            <p className="text-muted-foreground text-lg">
              {current.subtitle}
            </p>
          </div>

          {/* Option chips */}
          {current.options && (
            <div className="flex flex-wrap justify-center gap-2">
              {current.options.map((option) => (
                <button
                  key={option}
                  onClick={() => submit(option)}
                  className="rounded-full border-2 border-border px-4 py-2 text-sm transition-all hover:border-primary hover:bg-primary/5"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Text input (hidden when placeholder is empty, i.e. buttons-only step) */}
          {current.placeholder && (
            <form onSubmit={handleFormSubmit}>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleFormSubmit(e)
                    }
                  }}
                  placeholder={current.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-12 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/10 text-foreground/50 transition-colors hover:bg-foreground/20 disabled:opacity-30"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Enter to send
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat phase UI
// ---------------------------------------------------------------------------

interface DataBlock {
  type: string
  data: unknown
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  data_blocks?: DataBlock[]
  showData?: boolean
}

function ChatView({ initialPrompt }: { initialPrompt: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const conversationHistoryRef = useRef<Record<string, unknown>[]>([])
  const sentInitial = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, progress])

  useEffect(() => {
    if (sentInitial.current) return
    sentInitial.current = true
    sendMessage(initialPrompt)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleNewConversation = useCallback(() => {
    setMessages([])
    conversationHistoryRef.current = []
    window.location.reload()
  }, [])

  function toggleData(index: number) {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, showData: !msg.showData } : msg
      )
    )
  }

  async function sendMessage(text: string) {
    setMessages((prev) => [...prev, { role: 'user', content: text }])
    setLoading(true)
    setProgress('Connecting…')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_history: conversationHistoryRef.current,
        }),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response stream')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const dataLine = line.trim()
          if (!dataLine.startsWith('data: ')) continue
          const event = JSON.parse(dataLine.slice(6))

          if (event.event === 'progress') {
            setProgress(event.message)
          } else if (event.event === 'complete') {
            conversationHistoryRef.current = event.conversation_history
            const hasData = event.data_blocks?.length > 0
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant' as const,
                content: event.response,
                data_blocks: event.data_blocks,
                showData: !hasData,
              },
            ])
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ])
    } finally {
      setLoading(false)
      setProgress('')
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    sendMessage(text)
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold">Counselor Agent</h1>
            <p className="text-xs text-muted-foreground">
              Personalized guidance for your situation
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewConversation}
          title="Start over"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className="space-y-2">
              <div
                className={cn(
                  'flex',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {msg.role === 'assistant' ? linkify(msg.content) : msg.content}
                </div>
              </div>

              {msg.data_blocks && msg.data_blocks.length > 0 && !msg.showData && (
                <div className="flex justify-start">
                  <button
                    onClick={() => toggleData(i)}
                    className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <Eye className="h-4 w-4" />
                    View report
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {msg.showData && msg.data_blocks && msg.data_blocks.length > 0 && (
                <DataDisplay blocks={msg.data_blocks} />
              )}
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm text-muted-foreground">
                <span className="typing-dot" />
                <span className="typing-dot [animation-delay:0.2s]" />
                <span className="typing-dot [animation-delay:0.4s]" />
                {progress && <span className="ml-1">{progress}</span>}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border-t px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
            placeholder="Ask a follow-up question..."
            disabled={loading}
            rows={1}
            className="flex min-h-9 max-h-[120px] flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={loading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page: intake then chat
// ---------------------------------------------------------------------------

function buildPrompt(answers: Record<string, string>): string {
  const lines = ["Here's my situation:"]

  lines.push(`- Where I am: ${answers.segment}`)

  if (answers.school_approach) lines.push(`- School plans: ${answers.school_approach}`)
  if (answers.target_schools) lines.push(`- Schools I'm considering: ${answers.target_schools}`)
  if (answers.target_state) lines.push(`- State I'm looking at: ${answers.target_state}`)
  if (answers.has_degree) lines.push(`- Have a degree: ${answers.has_degree}`)
  if (answers.current_major) lines.push(`- Current major: ${answers.current_major}`)
  if (answers.change_reason) lines.push(`- Reason for change: ${answers.change_reason}`)
  if (answers.major_studied) lines.push(`- Major I studied: ${answers.major_studied}`)
  if (answers.career_direction) lines.push(`- Career direction: ${answers.career_direction}`)
  if (answers.school_type) lines.push(`- School type preference: ${answers.school_type}`)
  if (answers.school_size) lines.push(`- School size preference: ${answers.school_size}`)
  if (answers.budget) lines.push(`- Budget: ${answers.budget}`)
  if (answers.sort_preference) lines.push(`- Rank schools by: ${answers.sort_preference}`)
  if (answers.trade_interest) lines.push(`- College alternatives: ${answers.trade_interest}`)
  if (answers.interests) lines.push(`- Fields that interest me: ${answers.interests}`)
  if (answers.priority) lines.push(`- What matters most: ${answers.priority}`)
  if (answers.career_priority) lines.push(`- What matters most: ${answers.career_priority}`)
  if (answers.finances_deep_dive) lines.push(`- Financial detail level: ${answers.finances_deep_dive}`)

  lines.push('')
  lines.push('Based on all of this, give me personalized advice.')

  return lines.join('\n')
}

export default function CounselorPage() {
  const [phase, setPhase] = useState<'intake' | 'chat'>('intake')
  const [prompt, setPrompt] = useState('')

  function handleIntakeComplete(answers: Record<string, string>) {
    setPrompt(buildPrompt(answers))
    setPhase('chat')
  }

  if (phase === 'intake') {
    return <IntakeFlow onComplete={handleIntakeComplete} />
  }

  return <ChatView initialPrompt={prompt} />
}
