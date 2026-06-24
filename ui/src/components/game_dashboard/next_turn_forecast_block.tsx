import { MoneyValue } from '../money_value'
import type { NextTurnForecast, TurnCashflowLine } from './next_turn_forecast'

function CashflowRow({ line, isLight }: { line: TurnCashflowLine; isLight: boolean }) {
  const isIncome = line.amount > 0

  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className={`min-w-0 truncate ${isIncome ? 'text-emerald-600' : isLight ? 'text-slate-700' : 'text-slate-300'}`}>
        {line.label}
      </span>
      <span className="shrink-0 border-b border-dotted border-slate-600/50 mx-1 flex-1" aria-hidden />
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
  forecast,
  isLight = false,
}: {
  forecast: NextTurnForecast
  isLight?: boolean
}) {
  const sectionTitle = isLight
    ? 'mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-600'
    : 'mb-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400'
  const secondaryText = isLight ? 'text-slate-600' : 'text-slate-400'

  const hasLines = forecast.lines.length > 0

  return (
    <section className={`rounded-[24px] border p-3 ring-1 ${
      isLight
        ? 'border-slate-200/80 bg-white/70 ring-slate-200/60'
        : 'border-slate-700/40 bg-slate-800/50 ring-slate-700/20'
    }`}>
      <div className="mb-2">
        <h3 className={sectionTitle}>Следующий ход</h3>
        <p className={`mt-0.5 text-[11px] ${secondaryText}`}>
          Зачисления и списания при завершении хода
        </p>
      </div>

      {!hasLines ? (
        <p className={`rounded-xl border border-dashed px-3 py-4 text-center text-sm ${secondaryText} ${
          isLight ? 'border-slate-300' : 'border-white/10'
        }`}>
          Нет запланированных операций
        </p>
      ) : (
        <article className={`relative overflow-hidden rounded-xl border px-4 pb-4 pt-3.5 shadow-inner ${
          isLight
            ? 'border-slate-300/80 bg-slate-50 shadow-slate-200/40'
            : 'border-slate-600/35 bg-[#0c1218] shadow-black/30'
        }`}>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(148,163,184,0.15)_6px,rgba(148,163,184,0.15)_12px)]" />

          <div className="space-y-2.5 border-b border-dashed border-slate-600/45 pb-3">
            {forecast.lines.map((line) => (
              <CashflowRow key={line.id} line={line} isLight={isLight} />
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

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(90deg,transparent,transparent_6px,rgba(148,163,184,0.12)_6px,rgba(148,163,184,0.12)_12px)]" />
        </article>
      )}
    </section>
  )
}
