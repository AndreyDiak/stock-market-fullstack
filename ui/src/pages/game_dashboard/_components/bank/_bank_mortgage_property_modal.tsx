import { useState } from 'react'
import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { format_turns_left_label } from '../../_model/utils'
import { CategoryChip } from '../shared'
import { BankCommercialBadge } from './_bank_commercial_income_highlight'
import type { MortgagePropertyDetails } from './_bank_mappers'
import { PairList, PairListGroup, PairListRow } from './_bank_pair_list'
import { buildPropertyFinanceSummary } from './_bank_property_finance_summary'
import { BankPropertyFinanceSummaryBlock } from './_bank_property_finance_summary_block'
import { BankPropertyModalHeader } from './_bank_property_modal_header'
import type { PropertyOperation } from './_bank_operation_history'
import { InstallmentPaymentHistoryModal } from './_bank_installment_payment_history_modal'
import './_bank_operation_history_modal.css'

export function BankMortgagePropertyModal({
  property,
  onClose,
}: {
  property: MortgagePropertyDetails | null
  onClose: () => void
}) {
  const [showPaymentHistory, setShowPaymentHistory] = useState(false)

  if (!property) return null

  const { loan } = property
  const projectedTotal = loan.paidAmount + loan.remainingAmount

  const summary = buildPropertyFinanceSummary({
    itemRef: property.itemRef,
    dealPrice: loan.purchasePrice,
    totalPaid: loan.paidAmount,
    finalComparisonTotal: projectedTotal,
    purchaseTurn: property.purchaseTurn,
    details: property.details,
    wasInstallment: true,
  })

  const paymentHistoryOperation: PropertyOperation = {
    id: loan.id,
    type: 'buy',
    itemRef: property.itemRef,
    itemName: property.name,
    price: loan.purchasePrice,
    paymentLabel: 'В кредит',
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
        labelledBy="bank-mortgage-property-modal-title"
        panelClassName="bank-operation-modal pointer-events-auto relative w-full max-w-md outline-none"
      >
        <div className="bank-operation-modal__shell">
          <BankPropertyModalHeader
            titleId="bank-mortgage-property-modal-title"
            itemRef={property.itemRef}
            name={property.name}
            description={property.description}
            badges={
              <>
                <CategoryChip>ИПОТЕКА</CategoryChip>
                {property.passiveIncome > 0 ? <BankCommercialBadge /> : null}
              </>
            }
          />
          <BankPropertyFinanceSummaryBlock summary={summary} />

          <section className="bank-finance-summary bank-finance-summary--secondary">
            <h4 className="bank-finance-summary__title">Текущий кредит</h4>
            <PairList>
              <PairListGroup>
                <PairListRow label="Остаток долга">
                  <MoneyValue amount={loan.remainingAmount} size="sm" color="red" className="inline-flex" />
                </PairListRow>
                <PairListRow label="Платёж / ход">
                  <MoneyValue amount={loan.paymentPerTurn} size="sm" className="inline-flex" />
                </PairListRow>
                <PairListRow label="Осталось ходов">
                  <span>{format_turns_left_label(loan.turnsRemaining)}</span>
                </PairListRow>
              </PairListGroup>
            </PairList>
          </section>

          <footer className="bank-operation-modal__footer">
            {property.details?.firstPayment ? (
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
