import type { news_item } from '../../_model/types'
import { gameAudio } from '../../../../lib/audio/game_audio'
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
import { getSectorIcon } from '../exchange/_sector_icons'
import { formatSectorLabel } from '../exchange/_stock_grade_config'
import { StockNewsCard } from './_stock_news_card'
import { RealtyNewsCard } from './_realty_news_card'
import { DealNewsCard } from './_deal_news_card'
import './_news.css'
import type { GameDashboardThemeTokens } from '../shared'

const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38bdf8',
  HEALTHCARE: '#fb7185',
  FINANCE: '#fbbf24',
  AGRICULTURE: '#34d399',
  ENERGY: '#a78bfa',
}

export type NewsCardVariant = 'full' | 'compact'

interface NewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
  variant?: NewsCardVariant
  pinned?: boolean
  latest?: boolean
  turn?: number
  onSelect?: (item: news_item) => void
}

function NewsTypeChip({ item }: { item: news_item }) {
  const category = getNewsCategoryForItem(item)
  const config = NEWS_CATEGORY_CONFIG[category]
  const Icon = config.Icon

  return (
    <span className={`news-card__type-chip ${config.chipClass}`}>
      <Icon className="news-card__type-icon" aria-hidden />
      {config.label}
    </span>
  )
}

export function NewsCard({
  item,
  theme,
  variant = 'full',
  pinned = false,
  latest = false,
  turn,
  onSelect,
}: NewsCardProps) {
  const insider = is_insider_news(item)
  const interactive = Boolean(onSelect)
  const category = getNewsCategoryForItem(item)
  const categoryConfig = NEWS_CATEGORY_CONFIG[category]
  const isCompact = variant === 'compact'

  const turnsLeft =
    item.turnsLeft ??
    (insider && turn != null ? get_insider_turns_left(item, turn) ?? undefined : undefined)

  const useInsiderFrame = insider && !isCompact
  const accentClass = insider ? 'bg-amber-400' : categoryConfig.accentClass

  const cardClass = [
    'news-card shrink-0',
    'group',
    `news-card--${category}`,
    isCompact ? 'news-card--compact' : '',
    interactive ? 'news-card--interactive' : '',
    latest ? 'news-card--latest' : '',
    latest && item.kind === 'MARKET' ? 'news-card--market-highlight' : '',
    useInsiderFrame ? 'news-card--insider' : '',
    pinned ? 'sticky top-0 z-10' : '',
    theme.isLight ? 'news-card--light' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const showTimeLabel = !latest

  const body = (
    <div
      className={`news-card__inner flex flex-col ${
        isCompact ? 'gap-2 p-2.5 pl-3.5' : 'gap-0 p-0'
      }`}
    >
      <div aria-hidden className={`news-card__accent ${accentClass}`} />

      <div className={`news-card__header ${isCompact ? 'p-2.5 pb-0 pl-3.5' : 'p-3.5 pb-0 pl-4'}`}>
        <div className="news-card__meta">
          <div className="news-card__meta-left">
            <NewsTypeChip item={item} />
            {category === 'stock' && item.visibleSectors && item.visibleSectors.length > 0
              ? item.visibleSectors.map((sector) => {
                  const Icon = getSectorIcon(sector)
                  const color = SECTOR_COLORS[sector] ?? '#94a3b8'
                  return (
                    <span
                      key={sector}
                      className="news-card__sector-chip"
                      style={{
                        borderColor: `${color}40`,
                        background: `${color}15`,
                        color,
                      }}
                    >
                      <Icon className="news-card__sector-chip-icon" aria-hidden />
                      {formatSectorLabel(sector)}
                    </span>
                  )
                })
              : null}
            {insider ? <InsiderNewsBadge /> : null}
            {pinned ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/50 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-100">
                <span aria-hidden>📌</span>
                Закреплено
              </span>
            ) : null}
          </div>

          <div className="news-card__meta-right">
            {latest ? <span className="news-card__new">Новое</span> : null}
            {insider && turnsLeft != null && !isCompact ? (
              <span className="whitespace-nowrap rounded-md border border-amber-400/35 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-amber-200">
                {format_insider_relevance_label(turnsLeft)}
              </span>
            ) : null}
            {showTimeLabel ? (
              <span
                className={`news-card__time ${
                  insider
                    ? '!text-amber-300/90'
                    : item.hot
                      ? '!text-emerald-400'
                      : ''
                }`}
              >
                {item.timeLabel}
              </span>
            ) : null}
          </div>
        </div>

      </div>

      {isCompact ? (
        <div className="flex flex-col gap-1 px-2.5 pb-2.5 pl-3.5">
          <h4 className="news-card__title news-card__title--compact">{item.title}</h4>
          <p className="news-card__description news-card__description--compact">{item.excerpt}</p>
        </div>
      ) : (
        <div className={`news-card__content ${category === 'realty' ? 'news-card__content--realty' : ''}`}>
          {category === 'stock' ? (
            <StockNewsCard item={item} theme={theme} turn={turn} />
          ) : category === 'realty' ? (
            <RealtyNewsCard item={item} theme={theme} />
          ) : (
            <DealNewsCard item={item} theme={theme} />
          )}
        </div>
      )}

      {interactive && !isCompact ? (
        <div className="news-card__footer">
          <span className="news-card__footer-btn">
            Подробнее →
          </span>
        </div>
      ) : null}
    </div>
  )

  if (!interactive) {
    return <div id={`news-card-${item.id}`} className={cardClass}>{body}</div>
  }

  const handleSelect = () => {
    gameAudio.playSfx('buttonClick')
    onSelect?.(item)
  }

  return (
    <div
      id={`news-card-${item.id}`}
      role="button"
      tabIndex={0}
      className={cardClass}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleSelect()
        }
      }}
    >
      {body}
    </div>
  )
}
