import type { GameDashboardThemeTokens } from '../../components/game_dashboard/game_dashboard_theme'
import type { bot_deal } from './model/types'
import { BotDealCard } from './_bot_deal_card'

export function OtcDealsPanel({
  deals,
  onAccept,
  onDecline,
  theme,
}: {
  deals: bot_deal[]
  onAccept: (id: string) => void
  onDecline: (id: string) => void
  theme: GameDashboardThemeTokens
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className={`text-xl font-bold tracking-wider ${theme.primaryText}`}>Сделки</h2>
          <p className={`mt-1 text-sm ${theme.secondaryText}`}>Личные предложения от ботов</p>
        </div>
        <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          {deals.length} активных
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto pr-1">
        {deals.length === 0 ? (
          <div
            className={`flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center ${
              theme.isLight ? 'border-slate-300 bg-slate-50' : 'border-white/10 bg-slate-800/30'
            }`}
          >
            <p className={`text-lg font-bold ${theme.primaryText}`}>Нет активных сделок</p>
            <p className={`mt-2 max-w-sm text-sm ${theme.secondaryText}`}>
              Боты предложат вам сделки вне биржи по мере игры. Новые появятся здесь автоматически.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {deals.map((deal) => (
              <BotDealCard key={deal.id} deal={deal} onAccept={onAccept} onDecline={onDecline} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
