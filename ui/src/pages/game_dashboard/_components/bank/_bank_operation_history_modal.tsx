import { useState } from 'react'

import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { format_turn_step_label } from '../../_model/utils'
import { StatusBadge } from '../shared'
import type { PropertyOperation } from './_bank_operation_history'
import { PairList, PairListGroup, PairListRow } from './_bank_pair_list'
import { buildPropertyFinanceSummary } from './_bank_property_finance_summary'
import { BankPropertyFinanceSummaryBlock } from './_bank_property_finance_summary_block'
import { BankPropertyModalHeader } from './_bank_property_modal_header'
import { InstallmentPaymentHistoryModal } from './_bank_installment_payment_history_modal'
import './_bank_operation_history_modal.css'

function SellFinanceSummary({ operation }: { operation: PropertyOperation }) {
  const purchasePrice = operation.priceDiff?.referencePrice ?? null

  return (
    <section className="bank-finance-summary">
      <h4 className="bank-finance-summary__title">Финансовый итог</h4>
      <PairList>
        {purchasePrice != null ? (
          <PairListGroup>
            <PairListRow label="Цена покупки">
              <MoneyValue amount={purchasePrice} size="sm" className="inline-flex" />
            </PairListRow>
            <PairListRow label="Цена продажи">
              <MoneyValue amount={operation.price} size="sm" color="amber" className="inline-flex" />
            </PairListRow>
            {operation.priceDiff ? (
              <PairListRow
                label={
                  operation.priceDiff.amount >= 0 ? 'Прибыль к покупке' : 'Убыток к покупке'
                }
              >
                <MoneyValue
                  amount={Math.abs(operation.priceDiff.amount)}
                  size="sm"
                  color={operation.priceDiff.amount >= 0 ? 'emerald' : 'red'}
                  prefix={operation.priceDiff.amount >= 0 ? '+' : '−'}
                  className="inline-flex"
                />
              </PairListRow>
            ) : null}
          </PairListGroup>
        ) : (
          <PairListGroup>
            <PairListRow label="Цена продажи">
              <MoneyValue amount={operation.price} size="sm" color="amber" className="inline-flex" />
            </PairListRow>
          </PairListGroup>
        )}

        <PairListGroup>
          <PairListRow label="Ход сделки">
            <span>{format_turn_step_label(operation.turnStep)}</span>
          </PairListRow>
        </PairListGroup>
      </PairList>
    </section>
  )
}

export function BankOperationHistoryModal({
  operation,
  onClose,
}: {
  operation: PropertyOperation | null
  onClose: () => void
}) {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)

  if (!operation) return null

  const isBuy = operation.type === 'buy'
  const wasInstallment = operation.paymentLabel === 'В кредит'

  const buySummary = isBuy
    ? buildPropertyFinanceSummary({
        itemRef: operation.itemRef,
        dealPrice: operation.price,
        totalPaid: wasInstallment
          ? operation.price + (operation.details?.overpayment ?? 0)
          : operation.price,
        purchaseTurn: operation.turnStep,
        details: operation.details,
        wasInstallment,
      })
    : null

  return (
    <GameModal
      open={operation != null}
      onClose={onClose}
      labelledBy="bank-operation-modal-title"
      panelClassName="bank-operation-modal pointer-events-auto relative w-full max-w-md outline-none"
    >
      <div className="bank-operation-modal__shell">
        <BankPropertyModalHeader
          titleId="bank-operation-modal-title"
          itemRef={operation.itemRef}
          name={operation.itemName}
          badges={
            <>
              <StatusBadge tone={isBuy ? 'sky' : 'amber'}>
                {isBuy ? 'Покупка' : 'Продажа'}
              </StatusBadge>
              {operation.paymentLabel ? (
                <span className="bank-operation-modal__payment-chip">{operation.paymentLabel}</span>
              ) : null}
            </>
          }
        />

        {isBuy && buySummary ? (
          <BankPropertyFinanceSummaryBlock summary={buySummary} />
        ) : (
          <SellFinanceSummary operation={operation} />
        )}

        <footer className="bank-operation-modal__footer">
          <div className="flex w-full items-center justify-between gap-2">
            {wasInstallment ? (
              <GameButton variant="teal" size="sm" onClick={() => setShowPaymentHistory(true)}>
                История платежей
              </GameButton>
            ) : <span />}
            <GameButton variant="muted" size="sm" onClick={onClose}>
              Закрыть
            </GameButton>
          </div>
        </footer>

        {showPaymentHistory ? (
          <InstallmentPaymentHistoryModal
            operation={operation}
            onClose={() => setShowPaymentHistory(false)}
          />
        ) : null}
      </div>
    </GameModal>
  )
}
