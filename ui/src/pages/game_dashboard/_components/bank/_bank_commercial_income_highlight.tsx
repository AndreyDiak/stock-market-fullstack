import { MoneyValue } from '../../../../components/money/money_value'
import { CoinIcon } from '../../../../shared/icons/coin_icon'
import { TrendArrowIcon } from '../../../../shared/icons/trend_arrow_icon'
import { StatusBadge } from '../shared'

export function BankCommercialBadge({ className = '' }: { className?: string }) {
  return (
    <StatusBadge tone="muted" className={`bank-commercial-badge ${className}`.trim()}>
      Коммерция
    </StatusBadge>
  )
}

export function BankCommercialIncomeChip({ amount }: { amount: number }) {
  if (amount <= 0) return null

  return (
    <span className="bank-loan-card__chip bank-loan-card__chip--emerald">
      <span className="bank-loan-card__chip-income">
        +
        <MoneyValue amount={amount} size="xs" color="emerald" className="inline-flex" />
        <span className="bank-loan-card__chip-suffix">/ ход</span>
      </span>
    </span>
  )
}

export function BankCommercialIncomeHighlight({
  amount,
  propertyName,
  compact = false,
  inline = false,
}: {
  amount: number
  propertyName?: string
  compact?: boolean
  inline?: boolean
}) {
  if (amount <= 0) return null

  if (inline) {
    return (
      <p className="bank-commercial-income-inline">
        {propertyName ? (
          <span className="bank-commercial-income-inline__label">{propertyName}:</span>
        ) : null}
        +<MoneyValue amount={amount} size="xs" color="emerald" className="inline-flex" />
        <span className="bank-commercial-income-inline__period">/ ход</span>
      </p>
    )
  }

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
      <span className="bank-commercial-income__label">{propertyName ?? 'Доход'}</span>

      <div className="bank-commercial-income__amount">
        <CoinIcon className="bank-commercial-income__coin" />
        <span className="bank-commercial-income__plus">+</span>
        <MoneyValue amount={amount} size="md" color="emerald" className="inline-flex" />
        <span className="bank-commercial-income__period">/ ход</span>
      </div>
    </div>
  )
}
