import { useEffect } from 'react'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import {
  filter_visible_news,
  find_pinned_insider,
  sort_news_for_panel,
} from '../../_model/utils'
import { NewsCard } from './_news_card'

export function NewsPanel() {
  const theme = useDashboardTheme()
  const { selectNews } = useDashboardUi()
  const news = useGameStore((state) => state.news)
  const turn = useGameStore((state) => state.turn)
  const loadNews = useGameStore((state) => state.loadNews)

  useEffect(() => {
    void loadNews()
  }, [loadNews])

  const visibleNews = filter_visible_news(news, turn)
  const pinned = find_pinned_insider(visibleNews, turn)
  const feed = sort_news_for_panel(visibleNews, turn).filter(
    (item) => !pinned || item.id !== pinned.id,
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold tracking-wider ${theme.primaryText}`}>
            Новости
          </h2>
          <p className={`mt-1 text-sm ${theme.secondaryText}`}>
            Лента рынка, слухи и инсайдерская информация
          </p>
        </div>
        <span
          className={`rounded-2xl border px-3 py-1 text-xs font-bold ring-1 ${
            theme.isLight
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-200/80'
              : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          }`}
        >
          Ход {turn}
        </span>
      </div>

      <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5 ${theme.scrollArea}`}>
        {pinned ? (
          <NewsCard
            item={pinned}
            theme={theme}
            pinned
            turn={turn}
            onSelect={selectNews}
          />
        ) : null}

        {feed.length === 0 && !pinned ? (
          <p className={`rounded-2xl border p-6 text-center text-sm ${theme.sidebarInset}`}>
            Пока нет новостей за этот период
          </p>
        ) : (
          feed.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              theme={theme}
              turn={turn}
              onSelect={selectNews}
            />
          ))
        )}
      </div>
    </div>
  )
}
