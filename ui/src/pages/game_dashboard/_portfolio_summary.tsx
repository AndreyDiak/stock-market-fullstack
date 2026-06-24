import { MoneyValue } from '../../components/money_value'
import { SECONDARY_TEXT_DARK } from './model/constants'
import type { portfolio_row } from './model/types'
import { calc_portfolio_stats } from './model/utils'

export function PortfolioSummary({
  portfolio,
  availableCash,
}: {
  portfolio: portfolio_row[]
  availableCash: number
}) {
  const { totalValue, todayProfit } = calc_portfolio_stats(portfolio)
  const profitPositive = todayProfit >= 0

  const metrics = [
    {
      label: 'Общая стоимость',
      value: <MoneyValue amount={totalValue} size="lg" color="white" />,
    },
    {
      label: 'Прибыль за сегодня',
      value: (
        <MoneyValue
          amount={Math.abs(Math.round(todayProfit))}
          size="lg"
          prefix={profitPositive ? '+' : '−'}
          color={profitPositive ? 'emerald' : 'red'}
        />
      ),
    },
    {
      label: 'Доступно денег',
      value: <MoneyValue amount={availableCash} size="lg" color="cyan" />,
    },
  ]

  return (
    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-2xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 shadow-lg shadow-black/30 ring-1 ring-slate-700/25"
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT_DARK}`}>
            {metric.label}
          </p>
          <div className="mt-1">{metric.value}</div>
        </div>
      ))}
    </div>
  )
}
