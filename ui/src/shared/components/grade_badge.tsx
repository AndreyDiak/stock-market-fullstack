const GRADE_STYLES: Record<string, string> = {
  F: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
  E: 'border-white/20 bg-white/10 text-white',
  D: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
  C: 'border-sky-500/35 bg-sky-500/15 text-sky-300',
  B: 'border-violet-500/35 bg-violet-500/15 text-violet-300',
  A: 'border-amber-400/45 bg-amber-400/15 text-amber-200',
}

export function GradeBadge({
  grade,
  size = 'sm',
}: {
  grade: string
  size?: 'sm' | 'md'
}) {
  const style = GRADE_STYLES[grade] ?? GRADE_STYLES.F
  const sizeClass = size === 'sm'
    ? 'h-7 min-w-[1.75rem] rounded-lg px-1.5 text-xs'
    : 'h-11 w-11 rounded-xl text-xl'

  return (
    <span
      className={`flex items-center justify-center border-2 bg-gradient-to-b from-white/10 to-black/20 font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_2px_4px_rgba(0,0,0,0.35)] shadow-lg ${sizeClass} ${style}`}
    >
      {grade}
    </span>
  )
}
