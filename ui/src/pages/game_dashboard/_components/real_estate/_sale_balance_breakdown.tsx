import { MoneyValue } from '../../../../components/money/money_value'
import type { InstallmentSaleBreakdown } from './_accept_deal_utils'

export function SaleBalanceBreakdown({
  breakdown,
}: {
  breakdown: InstallmentSaleBreakdown
}) {
  return (
    <div className="sale-balance-breakdown">
      <p className="sale-balance-breakdown__heading">Состав выплаты</p>
      <div className="sale-balance-breakdown__grid">
        <div className="sale-balance-breakdown__item">
          <span className="sale-balance-breakdown__label">Выплачено по кредиту</span>
          <MoneyValue amount={breakdown.paidTotal} size="sm" color="white" prefix="+" className="shrink-0" />
        </div>
        <div
          className={`sale-balance-breakdown__item sale-balance-breakdown__item--delta${
            breakdown.priceDelta >= 0 ? '-positive' : '-negative'
          }`}
        >
          <span className="sale-balance-breakdown__label">
            {breakdown.priceDelta >= 0 ? 'Надбавка к цене покупки' : 'Убыток к цене покупки'}
          </span>
          <MoneyValue
            amount={Math.abs(breakdown.priceDelta)}
            size="sm"
            color={breakdown.priceDelta >= 0 ? 'emerald' : 'red'}
            prefix={breakdown.priceDelta >= 0 ? '+' : '−'}
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  )
}
