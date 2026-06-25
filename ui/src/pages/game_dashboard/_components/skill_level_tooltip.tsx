import type { ReactNode } from 'react'
import type { SkillLevelTooltip } from './character_skills'

export type SkillLevelTooltipPlacement = 'top' | 'bottom'
export type SkillLevelTooltipAlign = 'start' | 'center' | 'end'

interface SkillLevelTooltipWrapProps {
  tooltip: SkillLevelTooltip
  children: ReactNode
  className?: string
  placement?: SkillLevelTooltipPlacement
  align?: SkillLevelTooltipAlign
}

const placementClasses: Record<SkillLevelTooltipPlacement, string> = {
  top: 'bottom-[calc(100%+6px)]',
  bottom: 'top-[calc(100%+6px)]',
}

const alignClasses: Record<SkillLevelTooltipAlign, string> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
}

export function getTooltipAlignForIndex(
  index: number,
  total: number,
  rightAlignedCount = 2,
): SkillLevelTooltipAlign {
  if (total <= 1) return 'center'
  if (index === 0) return 'start'
  if (index >= total - rightAlignedCount) return 'end'
  return 'center'
}

export function SkillLevelTooltipWrap({
  tooltip,
  children,
  className = '',
  placement = 'bottom',
  align = 'center',
}: SkillLevelTooltipWrapProps) {
  if (!tooltip.title && tooltip.lines.length === 0) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      tabIndex={0}
      className={`group/cell relative isolate cursor-help outline-none ${className}`}
      aria-label={[tooltip.title, ...tooltip.lines].join('. ')}
    >
      {children}

      <div
        role="tooltip"
        className={`pointer-events-none absolute z-30 w-max max-w-[min(13rem,calc(100vw-2rem))] rounded-lg border border-slate-600/55 bg-slate-950/95 px-2.5 py-2 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover/cell:opacity-100 group-focus-visible/cell:opacity-100 ${placementClasses[placement]} ${alignClasses[align]}`}
      >
        <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-400/90">
          {tooltip.title}
        </p>
        {tooltip.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </div>
  )
}
