type SkillSegmentBarSize = 'sm' | 'md'

const sizeStyles: Record<
  SkillSegmentBarSize,
  { container: string; segment: string }
> = {
  sm: { container: 'gap-0.5', segment: 'h-1.5 w-4' },
  md: { container: 'gap-1', segment: 'h-2 w-8' },
}

interface SkillSegmentBarProps {
  filled: number
  total: number
  size?: SkillSegmentBarSize
  className?: string
  highlightLastFilled?: boolean
}

export function SkillSegmentBar({
  filled,
  total,
  size = 'md',
  className = '',
  highlightLastFilled = false,
}: SkillSegmentBarProps) {
  const clampedFilled = Math.max(0, Math.min(filled, total))
  const styles = sizeStyles[size]

  return (
    <div
      className={`flex ${styles.container} ${className}`}
      role="progressbar"
      aria-valuenow={clampedFilled}
      aria-valuemin={0}
      aria-valuemax={total}
    >
      {Array.from({ length: total }, (_, index) => {
        const isFilled = index < clampedFilled
        const isHighlighted = highlightLastFilled && index === clampedFilled - 1

        return (
          <div
            key={index}
            className={`${styles.segment} shrink-0 rounded-sm ${
              isHighlighted
                ? 'bg-emerald-300 ring-1 ring-emerald-200/45'
                : isFilled
                  ? 'bg-emerald-500'
                  : 'bg-slate-700/50'
            }`}
          />
        )
      })}
    </div>
  )
}
