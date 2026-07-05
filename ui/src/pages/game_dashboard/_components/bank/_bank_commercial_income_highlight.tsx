import { MoneyValue } from '../../../../components/money/money_value'
import { CoinIcon } from '../../../../shared/icons/coin_icon'
import { TrendArrowIcon } from '../../../../shared/icons/trend_arrow_icon'
import { StatusBadge } from '../shared'

export function BankCommercialBadge({ className = '' }: { className?: string }) {
  return (
    <StatusBadge tone="amber" className={className}>
      Коммерция
    </StatusBadge>
  )
}

export function BankCommercialIncomeHighlight({
  amount,
  compact = false,
}: {
  amount: number
  compact?: boolean
}) {
  if (amount <= 0) return null

  if (compact) {
    return (
      <div className="bank-commercial-income bank-commercial-income--compact">
        <span className="bank-commercial-income__compact-amount">
          <TrendArrowIcon up className="bank-commercial-income__trend" />
          +<MoneyValue amount={amount} size="xs" color="emerald" className="inline-flex" />
          <span className="bank-commercial-income__period">/ ход</span>
        </span>
      </div>
    )
  }

  return (
    <div className="bank-commercial-income">
      <span className="bank-commercial-income__label">Приносит пассивный доход</span>

      <div className="bank-commercial-income__amount">
        <CoinIcon className="bank-commercial-income__coin" />
        <span className="bank-commercial-income__plus">+</span>
        <MoneyValue amount={amount} size="md" color="emerald" className="inline-flex" />
        <span className="bank-commercial-income__period">/ ход</span>
      </div>
    </div>
  )
}
