import { MoneyValue } from '../../../../components/money/money_value'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import type { TurnCashflowLine } from './_next_turn_forecast'
import type { GameDashboardThemeTokens } from '../shared'
import { SidebarSection } from '../shared'

function CashflowRow({
  line,
  theme,
}: {
  line: TurnCashflowLine
  theme: GameDashboardThemeTokens
}) {
  const isIncome = line.amount > 0

  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span
        className={`min-w-0 truncate ${
          isIncome
            ? 'text-emerald-400'
            : theme.isLight
              ? 'text-slate-700'
              : 'text-slate-300'
        }`}
      >
        {line.label}
      </span>
      <span
        className="mx-1 min-w-[1rem] flex-1 shrink-0 border-b border-dotted border-slate-600/50"
        aria-hidden
      />
      <MoneyValue
        amount={Math.abs(line.amount)}
        size="xs"
        negative={!isIncome}
        color={isIncome ? 'emerald' : 'red'}
        prefix={isIncome ? '+' : undefined}
        className="shrink-0"
      />
    </div>
  )
}

export function NextTurnForecastBlock() {
  const theme = useDashboardTheme()
  const forecast = useGameStore((state) => state.nextTurnForecast)
  const hasLines = forecast.lines.length > 0

  return (
    <SidebarSection
      title="Следующий ход"
      subtitle="Зачисления и списания при завершении хода"
      theme={theme}
    >
      {!hasLines ? (
        <p
          className={`rounded-xl border border-dashed px-3 py-4 text-center text-sm ${theme.secondaryText} ${
            theme.isLight ? 'border-slate-300' : 'border-white/10'
          }`}
        >
          Нет запланированных операций
        </p>
      ) : (
        <article className={`relative overflow-hidden px-4 pb-4 pt-3.5 ${theme.sidebarInset}`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(148,163,184,0.12)_6px,rgba(148,163,184,0.12)_12px)]" />

          <div className="space-y-2.5 border-b border-dashed border-slate-600/45 pb-3">
            {forecast.lines.map((line) => (
              <CashflowRow key={line.id} line={line} theme={theme} />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Итого
            </span>
            <MoneyValue
              amount={Math.abs(forecast.netChange)}
              size="sm"
              negative={forecast.netChange < 0}
              color={forecast.netChange >= 0 ? 'emerald' : 'red'}
              prefix={forecast.netChange > 0 ? '+' : undefined}
            />
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(148,163,184,0.1)_6px,rgba(148,163,184,0.1)_12px)]" />
        </article>
      )}
    </SidebarSection>
  )
}
