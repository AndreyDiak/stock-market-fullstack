import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { BotDealCard } from './_bot_deal_card'

export function OtcDealsPanel() {
  const theme = useDashboardTheme()
  const deals = useGameStore((state) => state.otcDeals)
  const acceptOtcDeal = useGameStore((state) => state.acceptOtcDeal)
  const removeOtcDeal = useGameStore((state) => state.removeOtcDeal)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2
            className={`text-xl font-bold tracking-wider ${theme.primaryText}`}
          >
            OTC-сделки
          </h2>
          <p className={`mt-1 text-sm ${theme.secondaryText}`}>
            Предложения от ботов на внебиржевой рынок
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
            Нет активных предложений. Завершите ход — боты могут прислать сделку в новостях.
          </p>
        ) : (
          deals.map((deal) => (
            <BotDealCard
              key={deal.id}
              deal={deal}
              onAccept={(id) => {
                const target = deals.find((entry) => entry.id === id)
                if (target) void acceptOtcDeal(target)
              }}
              onDecline={removeOtcDeal}
            />
          ))
        )}
      </div>
    </div>
  )
}
