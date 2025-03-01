"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  children: React.ReactNode
  className?: string
  onClose?: () => void
}

export function Drawer({ children, className, onClose }: DrawerProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className={cn(
        "relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        "absolute mt-1",
        className
      )}>
        <div className="p-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  )
} 