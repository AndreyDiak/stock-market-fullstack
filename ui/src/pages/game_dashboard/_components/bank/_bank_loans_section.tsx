import { BankPropertyLoanCard } from './_bank_property_loan_card'
import { calcMinPayoffAmount } from './_bank_payoff_utils'
import type { ActiveLoan } from './index'

export function BankLoansSection({
  loans,
  balance,
  payingOffLoanId,
  onOpenPayoff,
}: {
  loans: ActiveLoan[]
  balance: number
  payingOffLoanId: string | null
  onOpenPayoff: (loanId: string) => void
}) {
  return (
    <section className="bank-loans-section">
      <div className="bank-section-header">
        <div className="bank-section-header__divider" aria-hidden />
        <h3 className="bank-section-title">Текущие кредиты</h3>
        <div className="bank-section-header__divider bank-section-header__divider--reverse" aria-hidden />
      </div>

      {loans.length > 0 ? (
        <div className="space-y-2.5">
          {loans.map((loan) => (
            <BankPropertyLoanCard
              key={loan.id}
              loan={loan}
              balance={balance}
              busy={payingOffLoanId === loan.id}
              canOpenPayoff={balance >= calcMinPayoffAmount(loan.remainingAmount)}
              onOpenPayoff={() => onOpenPayoff(loan.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bank-empty-state bank-empty-state--compact">
          <p className="bank-empty-state__text">Нет активных кредитов</p>
        </div>
      )}
    </section>
  )
}
