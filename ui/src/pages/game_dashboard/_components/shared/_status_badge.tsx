import type { ReactNode } from 'react'

export function StatusBadge({
  children,
  tone = 'emerald',
  solid = false,
  className = '',
}: {
  children: ReactNode
  tone?: 'emerald' | 'amber' | 'sky' | 'muted'
  solid?: boolean
  className?: string
}) {
  const toneClass =
    tone === 'amber'
      ? solid
        ? 'border-amber-600/50 bg-amber-950 text-amber-300'
        : 'border-amber-500/25 bg-amber-500/10 text-amber-300'
      : tone === 'sky'
        ? solid
          ? 'border-sky-600/50 bg-sky-950 text-sky-300'
          : 'border-sky-500/25 bg-sky-500/10 text-sky-300'
        : tone === 'muted'
          ? solid
            ? 'border-slate-600/50 bg-slate-900 text-slate-300'
            : 'border-slate-600/35 bg-slate-800/60 text-slate-300'
          : solid
            ? 'border-emerald-600/50 bg-emerald-950 text-emerald-300'
            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold tabular-nums ${toneClass} ${className}`}
    >
      {children}
    </span>
  )
}
