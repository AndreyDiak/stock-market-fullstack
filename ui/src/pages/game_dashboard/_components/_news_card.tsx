import type { news_item } from '../_model/types'
import {
  format_insider_relevance_label,
  get_insider_turns_left,
  is_insider_news,
} from '../_model/utils'
import { InsiderNewsBadge } from './_insider_news_badge'
import type { GameDashboardThemeTokens } from './game_dashboard_theme'

interface NewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
  compact?: boolean
  pinned?: boolean
  turn?: number
  onSelect?: (item: news_item) => void
}

const HOVER_TRANSITION = 'duration-[350ms]'
const REVEAL_TRANSITION = 'duration-[400ms]'

const interactiveShell = `cursor-pointer transition-shadow ${HOVER_TRANSITION} ease-out hover:shadow-[0_0_24px_rgba(16,185,129,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/60`

const insiderInteractiveShell = `cursor-pointer transition-shadow ${HOVER_TRANSITION} ease-out hover:shadow-[0_0_32px_rgba(251,191,36,0.28)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/60`

const insiderRestingShell = 'shadow-[0_0_14px_rgba(251,191,36,0.1)]'

const readIssueReveal = `translate-y-full transition-transform ${REVEAL_TRANSITION} ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:translate-y-0 group-focus-visible:translate-y-0`

function sentimentAccentClass(sentiment: news_item['sentiment']) {
  if (sentiment === 'positive') return 'bg-emerald-500'
  if (sentiment === 'negative') return 'bg-red-500'
  return 'bg-slate-500'
}

function ReadIssueOverlay({
  insider,
  theme,
}: {
  insider: boolean
  theme: GameDashboardThemeTokens
}) {
  const backdropClass = insider
    ? 'bg-amber-950/82'
    : theme.isLight
      ? 'bg-white/88'
      : 'bg-slate-900/82'

  const labelClass = insider ? 'text-amber-300' : 'text-emerald-400'

  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-1 right-0 z-10 ${readIssueReveal}`}
      aria-hidden
    >
      <div className={`border-t border-white/5 px-2.5 py-1 backdrop-blur-md ${backdropClass}`}>
        <p className={`text-sm font-bold uppercase leading-none tracking-[0.12em] ${labelClass}`}>
          Читать выпуск →
        </p>
      </div>
    </div>
  )
}

export function NewsCard({
  item,
  theme,
  compact = false,
  pinned = false,
  turn,
  onSelect,
}: NewsCardProps) {
  const insider = is_insider_news(item)
  const interactive = Boolean(onSelect)
  const turnsLeft =
    item.turnsLeft ??
    (insider && turn != null ? get_insider_turns_left(item, turn) ?? undefined : undefined)

  const useInsiderFrame = (insider || pinned) && !compact
  const radius = useInsiderFrame ? 'rounded-2xl' : 'rounded-xl'

  const frameClass = useInsiderFrame
    ? `${radius} border border-amber-400/35 bg-gradient-to-br from-amber-500/12 via-slate-900/75 to-slate-900/60 transition-[border-color] ${HOVER_TRANSITION} ease-out group-hover:border-amber-300/50`
    : `${radius} border transition-[border-color] ${HOVER_TRANSITION} ease-out group-hover:border-emerald-400/30 ${
        theme.isLight
          ? 'border-slate-200/80 bg-white/80'
          : 'border-slate-700/40 bg-slate-900/60'
      }`

  const accentClass = insider ? 'bg-amber-400' : sentimentAccentClass(item.sentiment)

  const shellClass = [
    'group',
    radius,
    interactive ? (useInsiderFrame ? insiderInteractiveShell : interactiveShell) : '',
    useInsiderFrame ? insiderRestingShell : '',
    pinned ? 'sticky top-0 z-10' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <div className={frameClass}>
      <div className={`relative overflow-hidden ${compact ? 'p-2.5' : 'p-3'}`}>
        <div
          aria-hidden
          className={`absolute bottom-2 left-0 top-2 w-1 rounded-r-full ${accentClass}`}
        />

        <div className="pl-2.5">
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {insider ? <InsiderNewsBadge /> : null}
              {pinned ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/50 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-100">
                  <span aria-hidden>📌</span>
                  Закреплено
                </span>
              ) : null}
              {item.ticker ? (
                <span
                  className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                    insider && !compact
                      ? 'bg-amber-500/15 text-amber-200'
                      : theme.isLight
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-slate-800/80 text-slate-400'
                  }`}
                >
                  {item.ticker}
                </span>
              ) : null}
            </div>
            {!compact ? (
              <div className="flex shrink-0 flex-col items-end gap-1">
                {insider && turnsLeft != null ? (
                  <span className="whitespace-nowrap rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200">
                    {format_insider_relevance_label(turnsLeft)}
                  </span>
                ) : null}
                <span
                  className={`shrink-0 text-[10px] font-bold uppercase tracking-wider ${
                    insider
                      ? 'text-amber-300/90'
                      : item.hot
                        ? 'text-emerald-400'
                        : theme.secondaryText
                  }`}
                >
                  {item.timeLabel}
                </span>
              </div>
            ) : null}
          </div>
          <h4
            className={`font-bold leading-snug transition-colors ${HOVER_TRANSITION} ${
              compact ? 'text-sm' : 'text-base'
            } ${
              insider && !compact
                ? 'text-amber-50 group-hover:text-amber-100'
                : `${theme.primaryText} group-hover:text-emerald-100`
            }`}
          >
            {item.title}
          </h4>
          <p
            className={`mt-1.5 text-xs leading-relaxed ${
              compact ? 'line-clamp-2' : ''
            } ${insider && !compact ? 'text-amber-100/75' : theme.secondaryText}`}
          >
            {compact ? item.excerpt : item.body}
          </p>
        </div>

        {interactive ? <ReadIssueOverlay insider={insider && !compact} theme={theme} /> : null}
      </div>
    </div>
  )

  if (!interactive) {
    return <div className={shellClass}>{body}</div>
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={shellClass}
      onClick={() => onSelect?.(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect?.(item)
        }
      }}
    >
      {body}
    </div>
  )
}
