import { useMemo } from 'react'
import { MoneyValue } from '../../../../components/money/money_value'
import { useGameStore } from '../../../../stores/game.store'
import { useGameSettingsStore } from '../../../../stores/game_settings.store'
import type { NextTurnForecast, TurnCashflowLine } from './_next_turn_forecast'
import { EMPTY_NEXT_TURN_FORECAST } from './_next_turn_forecast'
import type { GameDashboardThemeTokens } from '../shared'
import { getGameDashboardTheme, SidebarSection } from '../shared'

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

export function NextTurnForecastBlock({
  forecast: forecastProp,
  forceDark,
}: {
  forecast?: NextTurnForecast
  forceDark?: boolean
} = {}) {
  const colorTheme = useGameSettingsStore((state) => state.colorTheme)
  const effectiveColorTheme = forceDark ? 'dark' : colorTheme
  const theme = useMemo(() => getGameDashboardTheme(effectiveColorTheme), [effectiveColorTheme])
  const storeForecast = useGameStore((state) => state.nextTurnForecast)
  const forecast = forecastProp ?? storeForecast ?? EMPTY_NEXT_TURN_FORECAST
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
        <article className="relative overflow-hidden rounded-xl border border-white/6 bg-slate-950/55 px-4 pb-4 pt-3.5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[repeating-linear-gradient(90deg,transparent,transparent_8px,rgba(148,163,184,0.06)_8px,rgba(148,163,184,0.06)_16px)]" />

          <div className="space-y-2 border-b border-dashed border-slate-600/35 pb-3">
            {forecast.lines.map((line) => (
              <CashflowRow key={line.id} line={line} theme={theme} />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-slate-800/40 px-2 py-1.5">
            <span className="text-xs font-bold text-slate-400">Итого</span>
            <MoneyValue
              amount={Math.abs(forecast.netChange)}
              size="sm"
              negative={forecast.netChange < 0}
              color={forecast.netChange >= 0 ? 'emerald' : 'red'}
              prefix={forecast.netChange > 0 ? '+' : undefined}
            />
          </div>
        </article>
      )}
    </SidebarSection>
  )
}
