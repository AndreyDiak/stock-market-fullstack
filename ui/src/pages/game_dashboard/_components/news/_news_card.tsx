import type { news_item } from '../../_model/types'
import {
  format_insider_relevance_label,
  get_insider_turns_left,
  is_insider_news,
} from '../../_model/utils'
import { useGameStore } from '../../../../stores/game.store'
import { InsiderNewsBadge } from './_insider_news_badge'
import {
  getNewsCategoryForItem,
  NEWS_CATEGORY_CONFIG,
} from './_news_category'
import { AssetImageFrame } from '../../../../shared/components'
import { getNewsPropertyAlt, getNewsPropertyImage } from './_news_asset_image'
import './_news.css'
import type { GameDashboardThemeTokens } from '../shared'

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

function NewsTensionBadge({ level }: { level: number }) {
  const clamped = Math.max(1, Math.min(5, level))
  const tones = [
    'border-slate-500/40 bg-slate-500/10 text-slate-300',
    'border-sky-500/35 bg-sky-500/10 text-sky-200',
    'border-amber-500/35 bg-amber-500/10 text-amber-200',
    'border-orange-500/35 bg-orange-500/10 text-orange-200',
    'border-rose-500/40 bg-rose-500/12 text-rose-200',
  ]

  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${tones[clamped - 1]}`}
      title={`Напряжение новости: ${clamped}/5`}
    >
      Ур. {clamped}
    </span>
  )
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

function NewsPropertyThumbnail({
  item,
  variant,
  propertyOffers,
}: {
  item: news_item
  variant: NewsCardVariant
  propertyOffers: Array<{ id: string; assetId: string; itemName?: string }>
}) {
  const image = getNewsPropertyImage(item, propertyOffers)
  if (!image) return null

  const alt = getNewsPropertyAlt(item, propertyOffers) ?? 'Недвижимость'

  return (
    <div className={`news-card__thumbnail news-card__thumbnail--${variant}`}>
      <AssetImageFrame
        src={image}
        alt={alt}
        size="fill"
        decorations={false}
      />
      <span className="news-card__thumbnail-vignette" aria-hidden />
    </div>
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
  const propertyOffers = useGameStore((state) => state.propertyOffers)
  const insider = is_insider_news(item)
  const interactive = Boolean(onSelect)
  const category = getNewsCategoryForItem(item)
  const categoryConfig = NEWS_CATEGORY_CONFIG[category]
  const isCompact = variant === 'compact'
  const propertyImage = getNewsPropertyImage(item, propertyOffers)
  const hasThumbnail = Boolean(propertyImage)

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

  const titleClass = [
    'news-card__title',
    isCompact ? 'news-card__title--compact' : 'news-card__title--full',
    insider && !isCompact ? 'text-amber-50 group-hover:text-amber-100' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const descriptionClass = [
    'news-card__description',
    isCompact ? 'news-card__description--compact' : 'news-card__description--full',
    insider && !isCompact ? 'text-amber-100/75' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const showTimeLabel = !latest

  const body = (
    <div
      className={`news-card__inner flex flex-col ${
        isCompact ? 'gap-2 p-2.5 pl-3.5' : 'gap-2.5 p-3.5 pl-4'
      }`}
    >
      <div aria-hidden className={`news-card__accent ${accentClass}`} />

      <div className="news-card__meta">
        <div className="news-card__meta-left">
          <NewsTypeChip item={item} />
          {item.newsLevel ? <NewsTensionBadge level={item.newsLevel} /> : null}
          {insider ? <InsiderNewsBadge /> : null}
          {pinned ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300/50 bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-100">
              <span aria-hidden>📌</span>
              Закреплено
            </span>
          ) : null}
          {item.ticker ? <span className="news-card__ticker">{item.ticker}</span> : null}
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

      <div
        className={`news-card__content flex flex-col gap-1.5${
          hasThumbnail ? ' news-card__content--with-thumb' : ''
        }`}
      >
        <div className="news-card__text space-y-1">
          <h4 className={titleClass}>{item.title}</h4>
          <p className={descriptionClass}>{isCompact ? item.excerpt : item.body}</p>
        </div>
        {hasThumbnail ? (
          <NewsPropertyThumbnail
            item={item}
            variant={variant}
            propertyOffers={propertyOffers}
          />
        ) : null}
      </div>

      {interactive ? <ReadIssueOverlay insider={insider && !isCompact} theme={theme} /> : null}
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
