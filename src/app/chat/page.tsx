'use client'

import { useState, useRef, useEffect, useCallback, FormEvent } from 'react'
import { Send, RotateCcw, ArrowRight, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { linkify } from '@/app/components/chat/linkify'

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

  if (isConsidering) {
    if (!keys.includes('school_approach')) return SCHOOL_APPROACH_STEP
    const approach = answers.school_approach?.toLowerCase() ?? ''
    if (approach.includes('schools i want to compare') && !keys.includes('target_schools')) return TARGET_SCHOOLS_STEP
    if (approach.includes('specific state') && !keys.includes('target_state')) return TARGET_STATE_STEP
    const wantsStateSearch = approach.includes('specific state')
    if (wantsStateSearch && !keys.includes('school_type')) return SCHOOL_TYPE_STEP
    if (wantsStateSearch && !keys.includes('school_size')) return SCHOOL_SIZE_STEP
    if (wantsStateSearch && !keys.includes('budget')) return BUDGET_STEP
    if (wantsStateSearch && !keys.includes('sort_preference')) return SORT_PREFERENCE_STEP
    if (!keys.includes('interests')) return INTERESTS_STEP
    if (!keys.includes('trade_interest')) return TRADE_INTEREST_STEP
    if (!keys.includes('priority')) return PRIORITY_STEP
    return null
  }

  if (isInCollege) {
    if (!keys.includes('current_major')) return CURRENT_MAJOR_STEP
    if (!keys.includes('change_reason')) return CHANGE_REASON_STEP
    const isDroppingOut = (answers.change_reason ?? '').toLowerCase().includes('dropping out')
    if (!isDroppingOut && !keys.includes('interests')) return INTERESTS_STEP
    if (!keys.includes('priority')) return PRIORITY_STEP
    return null
  }

  if (isNotInSchool) {
    if (!keys.includes('has_degree')) return HAS_DEGREE_STEP
    const hasDegree = answers.has_degree?.toLowerCase().startsWith('yes')
    if (hasDegree && !keys.includes('major_studied')) return MAJOR_STUDIED_STEP
    if (hasDegree && !keys.includes('career_direction')) return CAREER_DIRECTION_STEP
    const stayingInField = answers.career_direction?.toLowerCase().includes('in my field')
    if (!stayingInField && !keys.includes('interests')) return INTERESTS_STEP
    if (!keys.includes('career_priority')) return CAREER_PRIORITY_STEP
    return null
  }

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
    return stayingInField ? 5 : 6
  }

  if (segment.includes('considering whether')) {
    const approach = answers.school_approach?.toLowerCase() ?? ''
    if (approach.includes('general')) return 5
    if (approach.includes('specific state')) return 10
    return 6
  }
  return 5
}

function IntakeFlow({ onComplete }: { onComplete: (answers: Record<string, string>) => void }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [history, setHistory] = useState<string[]>([])
  const [selected, setSelected] = useState('')
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const current = getNextStep(answers)
  const answeredCount = Object.keys(answers).length
  const totalEstimate = estimateTotalSteps(answers)
  const progress = current ? (answeredCount / totalEstimate) * 100 : 100

  useEffect(() => {
    inputRef.current?.focus()
  }, [answeredCount])

  useEffect(() => {
    if (!current) return
    setSelected(answers[current.key] ?? '')
    setInput(answers[current.key] ?? '')
  }, [current, answers])

  const pending = current?.options ? selected : input.trim()

  function advance() {
    if (!pending || !current) return
    const next = { ...answers, [current.key]: pending }
    setHistory((prev) => [...prev, current.key])
    setAnswers(next)
    setSelected('')
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
    setSelected('')
    setInput('')
  }

  if (!current) return null

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-sm font-medium text-foreground">Counselor Agent</span>
          <div className="w-5" />
        </div>
        <div className="mx-auto mt-3 max-w-2xl">
          <div className="h-1 w-full rounded-full bg-secondary">
            <div
              className="h-1 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

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

          {current.options && (
            <div className="flex flex-wrap justify-center gap-2">
              {current.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelected(selected === option ? '' : option)}
                  className={cn(
                    'rounded-full border-2 px-4 py-2 text-sm transition-all',
                    selected === option
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary hover:bg-primary/5'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {current.placeholder && (
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setSelected('')
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    advance()
                  }
                }}
                placeholder={current.placeholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-t px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={goBack}
            disabled={history.length === 0}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={advance}
            disabled={!pending}
            className="gap-1.5"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  report_html?: string
  report_status?: 'success' | 'failed' | 'skipped'
  error?: boolean
}

function ChatView({ initialPrompt, intakeAnswers }: { initialPrompt: string; intakeAnswers: Record<string, string> }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [retryingIndex, setRetryingIndex] = useState<number | null>(null)
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

  function openReport(html: string) {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  async function retryReport(messageIndex: number) {
    const msg = messages[messageIndex]
    setRetryingIndex(messageIndex)

    try {
      const res = await fetch('/api/retry-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intake_answers: intakeAnswers,
          conversation_history: conversationHistoryRef.current,
          agent_text: msg.content,
        }),
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const report = await res.json()

      if (report.html) {
        setMessages((prev) => prev.map((m, i) =>
          i === messageIndex
            ? { ...m, content: report.summary || m.content, report_html: report.html, report_status: 'success' as const }
            : m
        ))
      } else {
        console.error('Report retry returned empty HTML:', report.error)
        setMessages((prev) => prev.map((m, i) =>
          i === messageIndex ? { ...m, report_status: 'failed' as const } : m
        ))
      }
    } catch (err) {
      console.error('Report retry failed:', err)
      setMessages((prev) => prev.map((m, i) =>
        i === messageIndex ? { ...m, report_status: 'failed' as const } : m
      ))
    } finally {
      setRetryingIndex(null)
    }
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
          intake_answers: intakeAnswers,
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
            console.log('Agent complete:', {
              report_status: event.report_status,
              report_html_length: event.report_html?.length ?? 0,
            })
            conversationHistoryRef.current = event.conversation_history
            setMessages((prev) => [
              ...prev,
              {
                role: 'assistant' as const,
                content: event.response,
                report_html: event.report_html || undefined,
                report_status: event.report_status,
              },
            ])
          }
        }
      }
    } catch (err) {
      console.error('Agent request failed:', err)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant' as const, content: 'Something went wrong.', error: true },
      ])
    } finally {
      setLoading(false)
      setProgress('')
      inputRef.current?.focus()
    }
  }

  function retry() {
    const lastUserIndex = messages.findLastIndex((m) => m.role === 'user')
    if (lastUserIndex === -1) return
    const text = messages[lastUserIndex].content
    setMessages((prev) => prev.filter((m) => !m.error).slice(0, lastUserIndex))
    sendMessage(text)
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
                      : msg.error
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-secondary text-secondary-foreground'
                  )}
                >
                  {msg.role === 'assistant' ? linkify(msg.content) : msg.content}
                  {msg.error && (
                    <button
                      onClick={retry}
                      disabled={loading}
                      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Retry
                    </button>
                  )}
                </div>
              </div>

              {msg.report_html && (
                <div className="flex justify-start">
                  <button
                    onClick={() => openReport(msg.report_html!)}
                    className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    <FileText className="h-4 w-4" />
                    View report
                  </button>
                </div>
              )}

              {msg.report_status === 'failed' && !msg.report_html && (
                <div className="flex justify-start">
                  <button
                    onClick={() => retryReport(i)}
                    disabled={retryingIndex === i}
                    className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:opacity-50 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
                  >
                    <RotateCcw className={cn('h-4 w-4', retryingIndex === i && 'animate-spin')} />
                    {retryingIndex === i ? 'Generating report…' : 'Generate report'}
                  </button>
                </div>
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
  if (answers.career_priority) lines.push(`- Career priority: ${answers.career_priority}`)

  lines.push('')
  lines.push('Based on all of this, give me personalized advice.')

  return lines.join('\n')
}

export default function CounselorPage() {
  const [phase, setPhase] = useState<'intake' | 'chat'>('intake')
  const [prompt, setPrompt] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})

  function handleIntakeComplete(intake: Record<string, string>) {
    setAnswers(intake)
    setPrompt(buildPrompt(intake))
    setPhase('chat')
  }

  if (phase === 'intake') {
    return <IntakeFlow onComplete={handleIntakeComplete} />
  }

  return <ChatView initialPrompt={prompt} intakeAnswers={answers} />
}
