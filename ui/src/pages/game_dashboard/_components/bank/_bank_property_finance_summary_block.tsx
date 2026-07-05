import { MoneyValue } from '../../../../components/money/money_value'
import { format_turn_step_label } from '../../_model/utils'
import { PairList, PairListGroup, PairListRow } from './_bank_pair_list'
import {
  formatFinalDeltaLabel,
  formatMarketDeltaLabel,
  type PropertyFinanceSummary,
} from './_bank_property_finance_summary'

function MarketDeltaValue({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="bank-pair-list__neutral">Рыночная цена</span>
  }

  const isDiscount = delta < 0

  return (
    <MoneyValue
      amount={Math.abs(delta)}
      size="sm"
      color={isDiscount ? 'emerald' : 'red'}
      prefix={isDiscount ? '−' : '+'}
      className="inline-flex"
    />
  )
}

function FinalDeltaValue({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="bank-pair-list__neutral">По рынку</span>
  }

  const isBenefit = delta < 0

  return (
    <MoneyValue
      amount={Math.abs(delta)}
      size="sm"
      color={isBenefit ? 'emerald' : 'red'}
      prefix={isBenefit ? '−' : '+'}
      className="inline-flex"
    />
  )
}

export function BankPropertyFinanceSummaryBlock({
  summary,
}: {
  summary: PropertyFinanceSummary
}) {
  return (
    <section className="bank-finance-summary">
      <h4 className="bank-finance-summary__title">Финансовый итог</h4>

      <PairList>
        {summary.marketPrice != null ? (
          <PairListGroup>
            <PairListRow label="Рыночная цена">
              <MoneyValue amount={summary.marketPrice} size="sm" className="inline-flex" />
            </PairListRow>
            <PairListRow label="Договорная цена">
              <MoneyValue amount={summary.dealPrice} size="sm" color="amber" className="inline-flex" />
            </PairListRow>
            {summary.marketDelta != null ? (
              <PairListRow label={formatMarketDeltaLabel(summary.marketDelta)}>
                <MarketDeltaValue delta={summary.marketDelta} />
              </PairListRow>
            ) : null}
          </PairListGroup>
        ) : (
          <PairListGroup>
            <PairListRow label="Договорная цена">
              <MoneyValue amount={summary.dealPrice} size="sm" color="amber" className="inline-flex" />
            </PairListRow>
          </PairListGroup>
        )}

        <PairListGroup>
          {summary.downPayment != null ? (
            <PairListRow label="Первый взнос">
              <MoneyValue amount={summary.downPayment} size="sm" className="inline-flex" />
            </PairListRow>
          ) : null}
          {summary.creditRatePercent != null ? (
            <PairListRow label="Ставка по кредиту">
              <span>{summary.creditRatePercent}%</span>
            </PairListRow>
          ) : null}
          <PairListRow label="Итого заплачено">
            <MoneyValue amount={summary.totalPaid} size="sm" color="emerald" className="inline-flex" />
          </PairListRow>
        </PairListGroup>

        <PairListGroup>
          <PairListRow label="Ход сделки">
            <span>{format_turn_step_label(summary.dealTurn)}</span>
          </PairListRow>
          {summary.showLastPayment && summary.lastPaymentTurn != null ? (
            <PairListRow label="Ход последней выплаты">
              <span>{format_turn_step_label(summary.lastPaymentTurn)}</span>
            </PairListRow>
          ) : null}
        </PairListGroup>

        {summary.finalDelta != null ? (
          <PairListGroup>
            <PairListRow label={formatFinalDeltaLabel(summary.finalDelta)} emphasis>
              <FinalDeltaValue delta={summary.finalDelta} />
            </PairListRow>
          </PairListGroup>
        ) : null}
      </PairList>
    </section>
  )
}
