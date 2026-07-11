import { motion } from 'framer-motion'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { DealCard } from './_deal_card'
import '../bank/_bank.css'

export function DealsPanel() {
  const theme = useDashboardTheme()
  const deals = useGameStore((state) => state.deals)
  const acceptDeal = useGameStore((state) => state.acceptDeal)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* ===== Section Header ===== */}
      <div className="bank-page-header">
        <div className="bank-page-header__divider" aria-hidden />
        <div className="bank-page-header__content">
          <h2 className="bank-page-header__title">Сделки</h2>
          <p className="text-[10px] font-medium text-slate-400">
            Предложения обмена активами от ботов
          </p>
        </div>
        <div className="bank-page-header__divider bank-page-header__divider--reverse" aria-hidden />
      </div>

      <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5 ${theme.scrollArea}`}>
        {deals.length === 0 ? (
          <p className={`rounded-2xl border p-6 text-center text-sm ${theme.sidebarInset}`}>
            Нет активных предложений. Завершите ход — боты могут прислать сделку.
          </p>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                  delayChildren: 0.1,
                },
              },
            }}
            className="space-y-3"
          >
            {deals.map((deal) => (
              <motion.div
                key={deal.id}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.97 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
                  },
                }}
              >
                <DealCard
                  deal={deal}
                  onAccept={(id) => void acceptDeal(id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
