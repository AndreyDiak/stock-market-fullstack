import type { news_item } from '../../_model/types'
import {
  format_insider_relevance_label,
  get_insider_turns_left,
  is_insider_news,
} from '../../_model/utils'
import { InsiderNewsBadge } from './_insider_news_badge'
import {
  getNewsCategoryForItem,
  NEWS_CATEGORY_CONFIG,
} from './_news_category'
import './_news.css'
import type { GameDashboardThemeTokens } from '../shared'

interface NewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
  compact?: boolean
  pinned?: boolean
  latest?: boolean
  turn?: number
  onSelect?: (item: news_item) => void
}

const REVEAL_TRANSITION = 'duration-[400ms]'

const readIssueReveal = `translate-y-full transition-transform ${REVEAL_TRANSITION} ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform group-hover:translate-y-0 group-focus-visible:translate-y-0`

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
      className={`pointer-events-none absolute bottom-0 left-0 right-0 z-10 ${readIssueReveal}`}
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

function NewsTypeChip({
  item,
  compact = false,
}: {
  item: news_item
  compact?: boolean
}) {
  const category = getNewsCategoryForItem(item)
  const config = NEWS_CATEGORY_CONFIG[category]
  const Icon = config.Icon

  return (
    <span className={`news-card__type-chip ${config.chipClass}`}>
      <Icon className="news-card__type-icon" aria-hidden />
      {config.label}
      {compact ? null : <span className="sr-only"> новость</span>}
    </span>
  )
}

export function NewsCard({
  item,
  theme,
  compact = false,
  pinned = false,
  latest = false,
  turn,
  onSelect,
}: NewsCardProps) {
  const insider = is_insider_news(item)
  const interactive = Boolean(onSelect)
  const category = getNewsCategoryForItem(item)
  const categoryConfig = NEWS_CATEGORY_CONFIG[category]
  const turnsLeft =
    item.turnsLeft ??
    (insider && turn != null ? get_insider_turns_left(item, turn) ?? undefined : undefined)

  const useInsiderFrame = insider && !compact
  const accentClass = insider ? 'bg-amber-400' : categoryConfig.accentClass

  const cardClass = [
    'news-card',
    'group',
    `news-card--${category}`,
    compact ? 'news-card--compact' : '',
    interactive ? 'news-card--interactive cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400/60' : '',
    latest ? `news-card--latest ${categoryConfig.latestBorderClass} ${categoryConfig.glowClass}` : '',
    useInsiderFrame ? 'news-card--insider' : '',
    pinned ? 'sticky top-0 z-10' : '',
    theme.isLight ? 'border-slate-200/80 bg-white/90' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const titleClass = [
    'news-card__title transition-colors',
    compact ? 'news-card__title--compact' : 'news-card__title--full',
    insider && !compact
      ? 'text-amber-50 group-hover:text-amber-100'
      : theme.isLight
        ? 'text-slate-900 group-hover:text-emerald-900'
        : 'group-hover:text-emerald-50',
  ].join(' ')

  const descriptionClass = [
    'news-card__description',
    compact ? 'news-card__description--compact' : '',
    insider && !compact
      ? 'text-amber-100/75'
      : theme.isLight
        ? 'text-slate-600'
        : '',
  ]
    .filter(Boolean)
    .join(' ')

  const body = (
    <div className={`news-card__body ${compact ? 'p-2.5' : 'p-3'}`}>
      <div
        aria-hidden
        className={`news-card__accent ${accentClass}`}
      />
      {!insider ? (
        <div
          aria-hidden
          className={`news-card__top-rail bg-gradient-to-r ${categoryConfig.railClass}`}
        />
      ) : null}

      <div className="pl-2">
        <div className="news-card__header">
          <div className="news-card__header-left">
            <NewsTypeChip item={item} compact={compact} />
            {insider ? <InsiderNewsBadge /> : null}
            {pinned ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/50 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-100">
                <span aria-hidden>📌</span>
                Закреплено
              </span>
            ) : null}
            {item.ticker ? (
              <span className="news-card__ticker">{item.ticker}</span>
            ) : null}
          </div>

          <div className="news-card__meta">
            {latest ? (
              <span className="news-card__latest-badge">Новое</span>
            ) : null}
            {insider && turnsLeft != null && !compact ? (
              <span className="whitespace-nowrap rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200">
                {format_insider_relevance_label(turnsLeft)}
              </span>
            ) : null}
            <span
              className={`news-card__time ${
                insider
                  ? '!text-amber-300/90'
                  : item.hot
                    ? '!text-emerald-400'
                    : theme.isLight
                      ? '!text-slate-500'
                      : ''
              }`}
            >
              {item.timeLabel}
            </span>
          </div>
        </div>

        <h4 className={titleClass}>{item.title}</h4>
        <p className={descriptionClass}>{compact ? item.excerpt : item.body}</p>
      </div>

      {interactive ? <ReadIssueOverlay insider={insider && !compact} theme={theme} /> : null}
    </div>
  )

  if (!interactive) {
    return <div className={cardClass}>{body}</div>
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cardClass}
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
