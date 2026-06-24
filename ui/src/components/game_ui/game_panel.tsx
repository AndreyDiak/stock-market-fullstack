import type { ReactNode } from 'react'

interface GamePanelProps {
  children: ReactNode
  className?: string
}

export function GamePanel({ children, className = '' }: GamePanelProps) {
  return (
    <div
      className={`rounded-3xl border border-emerald-400/15 bg-[rgb(15,23,42)]/95 p-6 shadow-[0_12px_48px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl md:p-8 ${className}`}
    >
      {children}
    </div>
  )
}
