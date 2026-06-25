import type { news_panel_props } from '../_model/types'
import {
  filter_visible_news,
  find_pinned_insider,
  sort_news_for_panel,
} from '../_model/utils'
import { NewsCard } from './_news_card'

export function NewsPanel({ news, turn, theme, onSelectNews }: news_panel_props) {
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
              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          }`}
        >
          {visibleNews.length} записей
        </span>
      </div>

      <div className={`min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 py-1 pr-1 ${theme.scrollArea}`}>
        {visibleNews.length === 0 ? (
          <div
            className={`flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${
              theme.isLight
                ? 'border-slate-300 bg-slate-50'
                : 'border-white/10 bg-slate-800/30'
            }`}
          >
            <p className={`text-lg font-bold ${theme.primaryText}`}>Пока нет новостей</p>
            <p className={`mt-2 max-w-sm text-sm ${theme.secondaryText}`}>
              Завершите ход — рынок начнёт публиковать события, слухи и, возможно,
              инсайд.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pinned ? (
              <div className="space-y-2 py-0.5">
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/90">
                  <span
                    aria-hidden
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15 text-[10px]"
                  >
                    📌
                  </span>
                  Закреплено · актуальный инсайд
                </p>
                <NewsCard
                  item={pinned}
                  theme={theme}
                  pinned
                  turn={turn}
                  onSelect={onSelectNews}
                />
              </div>
            ) : null}

            {pinned && feed.length > 0 ? (
              <div
                aria-hidden
                className={`my-2 h-px ${theme.headerDivider}`}
              />
            ) : null}

            <div className="flex flex-col gap-3 py-0.5">
              {feed.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  theme={theme}
                  turn={turn}
                  onSelect={onSelectNews}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
