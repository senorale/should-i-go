'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Props {
  title: ReactNode
  subtitle?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export default function CollapsibleCard({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-6 text-left"
      >
        <span>
          <span className="block text-lg font-semibold">{title}</span>
          {subtitle && (
            <span className="mt-1 block text-sm font-normal text-muted-foreground">
              {subtitle}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && <div className="px-6 pb-6 pt-0">{children}</div>}
    </Card>
  )
}
