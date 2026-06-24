export const SEGMENT_BAR_COUNT = 10

export function ratioToPercent(completed: number, totalUnits: number) {
  if (totalUnits <= 0) return 0
  return Math.max(0, Math.min(100, (completed / totalUnits) * 100))
}

type SegmentBarVariant = 'emerald' | 'amber' | 'red'

const ACTIVE_CLASSES: Record<SegmentBarVariant, string> = {
  emerald: 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.65)]',
  amber: 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]',
  red: 'bg-gradient-to-r from-red-600 to-orange-400 shadow-[0_0_10px_rgba(239,68,68,0.45)]',
}

interface SegmentBarProps {
  /** Заполнение 0–100%; некратные 10% дают частичный последний сегмент */
  percent: number
  total?: number
  variant?: SegmentBarVariant
  className?: string
  heightClass?: string
}

export function SegmentBar({
  percent,
  total = SEGMENT_BAR_COUNT,
  variant = 'emerald',
  className = '',
  heightClass = 'h-2.5',
}: SegmentBarProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent))
  const exactFilled = (clampedPercent / 100) * total
  const fullSegments = Math.floor(exactFilled)
  const partialFill = exactFilled - fullSegments

  return (
    <div
      className={`flex gap-1 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(clampedPercent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {Array.from({ length: total }, (_, index) => {
        let fillWidth = 0
        if (index < fullSegments) fillWidth = 100
        else if (index === fullSegments) fillWidth = partialFill * 100

        return (
          <div
            key={index}
            className={`${heightClass} relative flex-1 overflow-hidden rounded-sm bg-slate-700/60`}
          >
            {fillWidth > 0 && (
              <div
                className={`absolute inset-y-0 left-0 rounded-sm transition-all duration-300 ${ACTIVE_CLASSES[variant]}`}
                style={{ width: `${fillWidth}%` }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
