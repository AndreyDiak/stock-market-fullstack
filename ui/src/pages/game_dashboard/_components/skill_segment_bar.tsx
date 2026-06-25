interface SkillSegmentBarProps {
  filled: number
  total: number
  className?: string
}

export function SkillSegmentBar({ filled, total, className = '' }: SkillSegmentBarProps) {
  const clampedFilled = Math.max(0, Math.min(filled, total))

  return (
    <div
      className={`flex gap-1 ${className}`}
      role="progressbar"
      aria-valuenow={clampedFilled}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, index) => (
        <div
          key={index}
          className={`h-2 w-8 shrink-0 rounded-sm ${
            index < clampedFilled ? 'bg-emerald-500' : 'bg-slate-700/50'
          }`}
        />
      ))}
    </div>
  )
}
