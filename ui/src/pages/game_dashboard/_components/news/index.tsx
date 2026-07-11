import { useEffect, useState, useMemo } from 'react'

import { useGameStore } from '../../../../stores/game.store'

import { useDashboardUi } from '../../_model/dashboard_ui_context'

import { useDashboardTheme } from '../../_model/use_dashboard_theme'

import { gameAudio } from '../../../../lib/audio/game_audio'

import { PanelSectionHeading } from '../shared'

import {
  filter_visible_news,
  find_latest_market_news,
  find_pinned_insider,
  sort_news_for_panel,
} from '../../_model/utils'

import { getNewsCategoryForItem } from './_news_category'
import type { NewsCategory } from './_news_category'

import { NewsCard } from './_news_card'

import { NewsCycleIndicator } from './_news_cycle_indicator'

import './_news.css'

const FILTER_OPTIONS: Array<{ value: NewsCategory | 'all'; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'stock', label: 'Акции' },
  { value: 'realty', label: 'Недвижимость' },
  { value: 'deal', label: 'Сделки' },
]

const FILTER_ICON_CLASS: Record<string, string> = {
  stock: 'news-filter-btn--stock',
  realty: 'news-filter-btn--realty',
  deal: 'news-filter-btn--deal',
}

export function NewsPanel() {
  const theme = useDashboardTheme()
  const { selectNews, highlightNewsId, clearHighlightNews } = useDashboardUi()

  const news = useGameStore((state) => state.news)
  const turn = useGameStore((state) => state.turn)
  const loadNews = useGameStore((state) => state.loadNews)

  const [activeFilter, setActiveFilter] = useState<NewsCategory | 'all'>('all')

  useEffect(() => {
    void loadNews()
  }, [loadNews])

  useEffect(() => {
    if (!highlightNewsId) return
    const node = document.getElementById(`news-card-${highlightNewsId}`)
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    const timer = window.setTimeout(() => clearHighlightNews(), 2500)
    return () => window.clearTimeout(timer)
  }, [highlightNewsId, clearHighlightNews])

  const visibleNews = useMemo(() => filter_visible_news(news, turn), [news, turn])
  const pinned = useMemo(() => find_pinned_insider(visibleNews, turn), [visibleNews, turn])
  const latestMarketNews = useMemo(() => find_latest_market_news(visibleNews, turn), [visibleNews, turn])

  const filteredFeed = useMemo(() => {
    const sorted = sort_news_for_panel(visibleNews, turn).filter(
      (item) => !pinned || item.id !== pinned.id,
    )
    if (activeFilter === 'all') return sorted
    return sorted.filter((item) => getNewsCategoryForItem(item) === activeFilter)
  }, [visibleNews, turn, pinned, activeFilter])

  const filterCounts = useMemo(() => {
    const all = visibleNews.length
    const stock = visibleNews.filter((item) => getNewsCategoryForItem(item) === 'stock').length
    const realty = visibleNews.filter((item) => getNewsCategoryForItem(item) === 'realty').length
    const deal = visibleNews.filter((item) => getNewsCategoryForItem(item) === 'deal').length
    return { all, stock, realty, deal }
  }, [visibleNews])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="news-page__header">
        <PanelSectionHeading
          title="Новости"
          subtitle="Лента рынка, слухи и инсайдерская информация"
        />
      </header>

      <NewsCycleIndicator news={visibleNews} />

      <div className="news-filters">
        {FILTER_OPTIONS.map((opt) => {
          const count = filterCounts[opt.value as keyof typeof filterCounts]
          const iconClass = opt.value !== 'all' ? FILTER_ICON_CLASS[opt.value] ?? '' : ''
          return (
            <button
              key={opt.value}
              type="button"
              className={[
                'news-filter-btn',
                activeFilter === opt.value ? 'news-filter-btn--active' : '',
                activeFilter === opt.value ? iconClass : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => { gameAudio.playSfx('buttonClick'); setActiveFilter(opt.value) }}
            >
              {opt.label}
              <span className="news-filter-count">{count}</span>
            </button>
          )
        })}
      </div>

      <div className={`news-feed ${theme.scrollArea}`}>
        {pinned ? (
          <NewsCard
            item={pinned}
            theme={theme}
            variant="full"
            pinned
            turn={turn}
            onSelect={selectNews}
          />
        ) : null}

        {filteredFeed.length === 0 && !pinned ? (
          <p className={`rounded-2xl border p-6 text-center text-sm ${theme.sidebarInset}`}>
            {activeFilter === 'all'
              ? 'Пока нет новостей за этот период'
              : `Нет новостей в категории «${FILTER_OPTIONS.find((o) => o.value === activeFilter)?.label}»`}
          </p>
        ) : (
          filteredFeed.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              theme={theme}
              variant="full"
              latest={latestMarketNews?.id === item.id}
              turn={turn}
              onSelect={selectNews}
            />
          ))
        )}
      </div>
    </div>
  )
}


