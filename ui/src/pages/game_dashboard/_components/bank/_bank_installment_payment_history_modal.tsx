import { useMemo } from 'react'

import { useGameStore } from '../../../../stores/game.store'
import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { format_turn_step_label } from '../../_model/utils'
import { PairList, PairListGroup, PairListRow } from './_bank_pair_list'
import { BankPropertyModalHeader } from './_bank_property_modal_header'
import type { PropertyOperation } from './_bank_operation_history'
import { StatusBadge } from '../shared'

interface InstallmentPaymentHistoryModalProps {
  operation: PropertyOperation
  onClose: () => void
}

export function InstallmentPaymentHistoryModal({
  operation,
  onClose,
}: InstallmentPaymentHistoryModalProps) {
  const inventoryItems = useGameStore((state) => state.inventoryItems)

  const inventoryItem = useMemo(
    () =>
      inventoryItems.find(
        (item) => item.itemRef === operation.itemRef && item.purchasePrice === operation.price,
      ),
    [inventoryItems, operation.itemRef, operation.price],
  )

  const monthlyPayment = inventoryItem?.monthlyPayment ?? 0
  const installmentsPaid = inventoryItem?.installmentsPaid ?? 0
  const purchaseTurn = operation.details?.purchaseTurn
  const firstPayment = operation.details?.firstPayment ?? 0

  const payments = useMemo(() => {
    if (!purchaseTurn || monthlyPayment <= 0 || installmentsPaid <= 0) return []

    const list: Array<{ turn: number; amount: number }> = []
    for (let i = 1; i <= installmentsPaid; i++) {
      list.push({ turn: purchaseTurn + i, amount: monthlyPayment })
    }
    return list
  }, [purchaseTurn, monthlyPayment, installmentsPaid])

  const hasAnyPayments = firstPayment > 0 || payments.length > 0

  return (
    <GameModal
      open
      onClose={onClose}
      labelledBy="installment-payment-history-title"
      panelClassName="bank-operation-modal pointer-events-auto relative w-full max-w-md outline-none"
      zIndex={60}
    >
      <div className="bank-operation-modal__shell">
        <BankPropertyModalHeader
          titleId="installment-payment-history-title"
          itemRef={operation.itemRef}
          name={operation.itemName}
          badges={
            <StatusBadge tone="sky">
              История платежей
            </StatusBadge>
          }
        />

        <section className="bank-finance-summary">
          <h4 className="bank-finance-summary__title">Платежи по объекту</h4>

          {!hasAnyPayments ? (
            <p className="bank-history__empty">Нет данных о платежах</p>
          ) : (
            <div className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              <PairList>
                {firstPayment > 0 && purchaseTurn ? (
                  <PairListGroup>
                    <PairListRow label={`Первоначальный взнос · ${format_turn_step_label(purchaseTurn)}`}>
                      <MoneyValue amount={firstPayment} size="sm" color="red" prefix="−" className="inline-flex" />
                    </PairListRow>
                  </PairListGroup>
                ) : null}

                {payments.length > 0 ? (
                  <PairListGroup>
                    {payments.map((p) => (
                      <PairListRow key={p.turn} label={format_turn_step_label(p.turn)}>
                        <MoneyValue amount={p.amount} size="sm" color="red" prefix="−" className="inline-flex" />
                      </PairListRow>
                    ))}
                  </PairListGroup>
                ) : null}
              </PairList>
            </div>
          )}
        </section>

        <footer className="bank-operation-modal__footer">
          <GameButton variant="muted" size="sm" onClick={onClose}>
            Закрыть
          </GameButton>
        </footer>
      </div>
    </GameModal>
  )
}
