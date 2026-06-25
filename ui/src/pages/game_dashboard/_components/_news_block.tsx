import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGameStore } from '../../../stores/game.store'
import type { news_item } from '../_model/types'
import { get_latest_news } from '../_model/utils'
import { newsBlockItemVariants, newsBlockLayoutTransition } from '../_model/news_animation'
import type { GameDashboardThemeTokens } from './game_dashboard_theme'
import { NewsCard } from './_news_card'
import { SidebarSection } from './sidebar_section'

export function NewsBlock({
  news,
  turn,
  theme,
  onOpenNews,
  onSelectNews,
}: {
  news: news_item[]
  turn: number
  theme: GameDashboardThemeTokens
  onOpenNews: () => void
  onSelectNews: (item: news_item) => void
}) {
  const latest = get_latest_news(news, 2, turn)
  const enteringNewsIds = useGameStore((state) => state.enteringNewsIds)
  const clearEnteringNews = useGameStore((state) => state.clearEnteringNews)

  useEffect(() => {
    if (enteringNewsIds.length === 0) return
    const timer = window.setTimeout(() => clearEnteringNews(), 520)
    return () => window.clearTimeout(timer)
  }, [enteringNewsIds, clearEnteringNews])

  return (
    <SidebarSection
      title="Новости"
      theme={theme}
      fill
      scrollable
      action={
        <button type="button" onClick={onOpenNews} className={theme.sidebarLink}>
          Все новости →
        </button>
      }
    >
      {latest.length === 0 ? (
        <p className={`px-1 py-2 text-xs ${theme.secondaryText}`}>
          Новостей пока нет. Завершите ход.
        </p>
      ) : (
        <div className="space-y-2 overflow-x-hidden">
          <AnimatePresence initial={false} mode="popLayout">
            {latest.map((item) => {
              const isEntering = enteringNewsIds.includes(item.id)

              return (
                <motion.div
                  key={item.id}
                  layout
                  className="py-0.5"
                  initial={isEntering ? 'enter' : false}
                  animate="visible"
                  exit="exit"
                  variants={newsBlockItemVariants}
                  transition={newsBlockLayoutTransition}
                >
                  <NewsCard
                    item={item}
                    theme={theme}
                    compact
                    turn={turn}
                    onSelect={onSelectNews}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </SidebarSection>
  )
}
