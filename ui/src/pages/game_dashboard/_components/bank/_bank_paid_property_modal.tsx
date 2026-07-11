import { useState } from 'react'
import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { CategoryChip, StatusBadge } from '../shared'
import { BankCommercialBadge } from './_bank_commercial_income_highlight'
import { buildPropertyFinanceSummary } from './_bank_property_finance_summary'
import { BankPropertyFinanceSummaryBlock } from './_bank_property_finance_summary_block'
import { BankPropertyModalHeader } from './_bank_property_modal_header'
import type { PaidProperty } from './index'
import type { PropertyOperation } from './_bank_operation_history'
import { InstallmentPaymentHistoryModal } from './_bank_installment_payment_history_modal'
import './_bank_operation_history_modal.css'

export function BankPaidPropertyModal({
  property,
  onClose,
}: {
  property: PaidProperty | null
  onClose: () => void
}) {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)

  if (!property) return null

  const summary = buildPropertyFinanceSummary({
    itemRef: property.itemRef,
    dealPrice: property.purchasePrice,
    totalPaid: property.totalPaid,
    purchaseTurn: property.purchaseTurn,
    details: property.details,
    wasInstallment: property.wasInstallment,
  })

  const paymentHistoryOperation: PropertyOperation = {
    id: property.id,
    type: 'buy',
    itemRef: property.itemRef,
    itemName: property.name,
    price: property.purchasePrice,
    paymentLabel: property.paymentLabel,
    sortAt: 0,
    timeLabel: '',
    turnStep: property.purchaseTurn,
    priceDiff: null,
    details: property.details,
  }

  return (
    <>
      <GameModal
        open={property != null}
        onClose={onClose}
        labelledBy="bank-paid-property-modal-title"
        panelClassName="bank-operation-modal pointer-events-auto relative w-full max-w-md outline-none"
      >
        <div className="bank-operation-modal__shell">
          <BankPropertyModalHeader
            titleId="bank-paid-property-modal-title"
            itemRef={property.itemRef}
            name={property.name}
            description={property.description}
            badges={
              <>
                <StatusBadge tone="emerald" className="uppercase tracking-wide">Куплено</StatusBadge>
                <CategoryChip>{property.paymentLabel}</CategoryChip>
                {property.passiveIncome > 0 ? <BankCommercialBadge /> : null}
              </>
            }
          />
          <BankPropertyFinanceSummaryBlock summary={summary} />

          <footer className="bank-operation-modal__footer">
            {property.wasInstallment && property.details?.firstPayment ? (
              <GameButton variant="muted" size="sm" disabled={showPaymentHistory} onClick={() => setShowPaymentHistory(true)}>
                Платежи
              </GameButton>
            ) : null}
            <GameButton variant="muted" size="sm" onClick={onClose} className="ml-auto">
              Закрыть
            </GameButton>
          </footer>
        </div>
      </GameModal>

      {showPaymentHistory ? (
        <InstallmentPaymentHistoryModal
          operation={paymentHistoryOperation}
          onClose={() => setShowPaymentHistory(false)}
        />
      ) : null}
    </>
  )
}
