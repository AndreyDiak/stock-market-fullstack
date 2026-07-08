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
  if (loans.length === 0) return null

  return (
    <section className="bank-loans-section">
      <div className="bank-section-header">
        <div className="bank-section-header__divider" aria-hidden />
        <h3 className="bank-section-title">Текущие кредиты</h3>
        <div className="bank-section-header__divider bank-section-header__divider--reverse" aria-hidden />
      </div>

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
    </section>
  )
}
