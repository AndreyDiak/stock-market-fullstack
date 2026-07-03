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
  const latest = get_latest_news(news, 5, turn)
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
      footer={
        <button
          type="button"
          onClick={openNewsTab}
          className={`w-full text-center text-xs ${theme.secondaryText} transition-opacity hover:opacity-80`}
        >
          Все новости →
        </button>
      }
    >
      {latest.length === 0 ? (
        <p className={`px-1 py-2 text-xs ${theme.secondaryText}`}>
          Новостей пока нет. Завершите ход.
        </p>
      ) : (
        <div className="space-y-2.5 overflow-x-hidden">
          <AnimatePresence initial={false}>
            {latest.map((item, index) => {
              const isEntering = enteringNewsIds.includes(item.id)

              return (
                <motion.div
                  key={item.id}
                  className="overflow-hidden"
                  initial={isEntering ? 'enter' : false}
                  animate="visible"
                  exit="exit"
                  variants={newsBlockItemVariants}
                  transition={newsBlockLayoutTransition}
                >
                  <NewsCard
                    item={item}
                    theme={theme}
                    variant="compact"
                    latest={index === 0}
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
