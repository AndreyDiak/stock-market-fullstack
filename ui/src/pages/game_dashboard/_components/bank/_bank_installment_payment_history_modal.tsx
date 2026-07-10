import { useMemo } from 'react'

import { useGameStore } from '../../../../stores/game.store'
import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { PairList, PairListGroup, PairListRow } from './_bank_pair_list'
import { BankPropertyModalHeader } from './_bank_property_modal_header'
import type { PropertyOperation } from './_bank_operation_history'
import { StatusBadge } from '../shared'
import {
  buildInstallmentPaymentHistory,
  resolveDownPaymentLabel,
} from './_bank_installment_payment_history'
import { calcInstallmentTotalOwed, resolveDownPaymentAmount } from '../real_estate/_installment_purchase'

interface InstallmentPaymentHistoryModalProps {
  operation: PropertyOperation
  onClose: () => void
}

export function InstallmentPaymentHistoryModal({
  operation,
  onClose,
}: InstallmentPaymentHistoryModalProps) {
  const inventoryItems = useGameStore((state) => state.inventoryItems)
  const currentTurn = useGameStore((state) => state.turn)
  const news = useGameStore((state) => state.news)

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
  const downPayment = inventoryItem ? resolveDownPaymentAmount(inventoryItem) : firstPayment
  const totalOwed = inventoryItem ? calcInstallmentTotalOwed(inventoryItem) : undefined

  const payments = useMemo(
    () =>
      buildInstallmentPaymentHistory({
        itemRef: operation.itemRef,
        purchaseTurn,
        monthlyPayment,
        installmentsPaid,
        finalPaymentTurn: operation.details?.finalPaymentTurn,
        currentTurn,
        news,
        isPaidOff: inventoryItem?.isPaidOff ?? false,
        downPayment,
        totalOwed,
      }),
    [
      operation.itemRef,
      purchaseTurn,
      monthlyPayment,
      installmentsPaid,
      operation.details?.finalPaymentTurn,
      currentTurn,
      news,
      inventoryItem?.isPaidOff,
      downPayment,
      totalOwed,
    ],
  )

  const downPaymentLabel = useMemo(
    () =>
      resolveDownPaymentLabel({
        itemRef: operation.itemRef,
        purchasePrice: operation.price,
        purchaseTurn,
        news,
      }),
    [operation.itemRef, operation.price, purchaseTurn, news],
  )

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
                {firstPayment > 0 ? (
                  <PairListGroup>
                    <PairListRow label={downPaymentLabel}>
                      <MoneyValue amount={firstPayment} size="sm" color="red" prefix="−" className="inline-flex" />
                    </PairListRow>
                  </PairListGroup>
                ) : null}

                {payments.length > 0 ? (
                  <PairListGroup>
                    {payments.map((payment) => (
                      <PairListRow key={payment.id} label={payment.label}>
                        <MoneyValue amount={payment.amount} size="sm" color="red" prefix="−" className="inline-flex" />
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
