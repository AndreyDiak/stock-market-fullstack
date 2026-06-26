import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { get_latest_news } from '../../_model/utils'
import { newsBlockItemVariants, newsBlockLayoutTransition } from '../../_model/news_animation'
import { NewsCard } from './_news_card'
import { SidebarSection } from '../shared'

export function NewsBlock() {
  const theme = useDashboardTheme()
  const { openNewsTab, selectNews } = useDashboardUi()
  const news = useGameStore((state) => state.news)
  const turn = useGameStore((state) => state.turn)
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
        <button type="button" onClick={openNewsTab} className={theme.sidebarLink}>
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
                    onSelect={selectNews}
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
