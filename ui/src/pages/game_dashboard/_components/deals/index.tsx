import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { DealCard } from './_deal_card'

export function DealsPanel() {
  const theme = useDashboardTheme()
  const deals = useGameStore((state) => state.deals)
  const acceptDeal = useGameStore((state) => state.acceptDeal)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold tracking-wider ${theme.primaryText}`}>
            Сделки
          </h2>
          <p className={`mt-1 text-sm ${theme.secondaryText}`}>
            Предложения обмена активами от ботов
          </p>
        </div>
        <span
          className={`rounded-2xl border px-3 py-1 text-xs font-bold ring-1 ${
            theme.isLight
              ? 'border-slate-200 bg-slate-50 text-slate-600 ring-slate-200/80'
              : 'border-slate-600/40 bg-slate-800/60 text-slate-300 ring-slate-600/30'
          }`}
        >
          {deals.length} активных
        </span>
      </div>

      <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto pr-0.5 ${theme.scrollArea}`}>
        {deals.length === 0 ? (
          <p className={`rounded-2xl border p-6 text-center text-sm ${theme.sidebarInset}`}>
            Нет активных предложений. Завершите ход — боты могут прислать сделку.
          </p>
        ) : (
          deals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onAccept={(id) => void acceptDeal(id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
