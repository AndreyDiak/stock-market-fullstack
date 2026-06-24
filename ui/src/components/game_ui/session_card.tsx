import type { ReactNode } from 'react'

interface SessionCardProps {
  children: ReactNode
  badge?: string
  className?: string
}

export function SessionCard({ children, badge = 'SESSION', className = '' }: SessionCardProps) {
  return (
    <div
      className={`relative w-full max-w-md shadow-[0_12px_40px_rgba(0,0,0,0.45)] ${className}`}
      style={{
        borderRadius: '1.35rem',
        background: 'linear-gradient(165deg, #3d4f63 0%, #1a2433 45%, #121a26 100%)',
      }}
    >
      <div className="p-2.5">
        <div className="mb-2 flex items-center gap-1.5 px-1.5 pt-0.5">
          <span className="h-2 w-2 rounded-full bg-red-400/70 shadow-[0_0_6px_rgba(248,113,113,0.5)]" />
          <span className="h-2 w-2 rounded-full bg-amber-400/70 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
            {badge}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-gradient-to-b from-[#0c1824] via-[#0a1f1a] to-[#071510] p-5 md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(77,196,141,0.12),transparent_55%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="relative z-10">{children}</div>
        </div>

        <div className="mx-1 mt-2 h-1 rounded-full bg-black/40">
          <div className="h-full w-full bg-gradient-to-r from-emerald-500 to-teal-400" />
        </div>
      </div>
    </div>
  )
}
