import { useMemo, useState, type ReactNode } from 'react'

import { MoneyValue } from '../../../../components/money/money_value'

import { useGameStore } from '../../../../stores/game.store'

import { useDashboardTheme } from '../../_model/use_dashboard_theme'

import { DashboardCard } from '../shared'


import { buildPropertyOperationHistory } from './_bank_operation_history'
import type { PropertyOperationDetails } from './_bank_operation_history'

import { BankOperationHistoryList } from './_bank_operation_history_list'

import { BankPayoffModal } from './_bank_payoff_modal'

import { BankPropertySlotsGrid } from './_bank_property_slots_grid'

import { BankPropertyLoanCard } from './_bank_property_loan_card'

import { calcMinPayoffAmount } from './_bank_payoff_utils'

import './_bank.css'



export interface ActiveLoan {

  id: string

  itemRef: string

  name: string

  purchasePrice: number

  paidAmount: number

  remainingAmount: number

  paymentPerTurn: number

  turnsRemaining: number

  paybackPct: number

  /** @deprecated use remainingAmount */

  initialDebt: number

  /** @deprecated use remainingAmount */

  remainingDebt: number

}



export interface PaidProperty {

  id: string

  itemRef: string

  name: string

  purchasePrice: number

  totalPaid: number

  wasInstallment: boolean

  purchasedAt: string

  purchasedAtLabel: string

  paymentLabel: string

  passiveIncome: number

  description: string | null

  purchaseTurn: number

  details: PropertyOperationDetails | null

}



export interface BankSummary {

  totalDebt: number

  paymentPerTurn: number

  turnsUntilNextCharge: number

}



function creditRatingBadgeClass(rating: string) {

  const grade = rating.charAt(0).toUpperCase()

  if (grade === 'A') {

    return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'

  }

  if (grade === 'B') {

    return 'border-amber-500/30 bg-amber-500/15 text-amber-300'

  }

  return 'border-red-500/30 bg-red-500/15 text-red-400'

}



function SummaryCard({

  label,

  value,

  valueClass,

}: {

  label: string

  value: ReactNode

  valueClass?: string

}) {

  return (

    <DashboardCard as="div" className="bank-summary-card">

      <p className="bank-summary-card__label">{label}</p>

      <div className={`bank-summary-card__value ${valueClass ?? 'text-white'}`}>{value}</div>

    </DashboardCard>

  )

}



function EmptyPropertyPlaceholder() {
  return (
    <div className="flex min-h-[5rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-600/40 bg-slate-800/20 p-4 text-center">
      <p className="text-xs text-[var(--text-secondary,#94a3b8)]">
        Слоты имущества ещё не открыты
      </p>
    </div>
  )
}



interface BankViewProps {

  balance?: number

  creditRating?: string

  summary?: BankSummary

  loans?: ActiveLoan[]

  paidProperties?: PaidProperty[]

  payingOffLoanId?: string | null

  onPayOff?: (loanId: string, payPercent: number) => void

}



export function BankView({

  balance: balanceProp,

  creditRating: creditRatingProp,

  summary: summaryProp,

  loans: loansProp,

  paidProperties: paidPropertiesProp,

  payingOffLoanId: payingOffLoanIdProp,

  onPayOff: onPayOffProp,

}: BankViewProps = {}) {

  const theme = useDashboardTheme()

  const storeBalance = useGameStore((state) => state.balance)

  const storeCreditRating = useGameStore((state) => state.creditRating)

  const storeSummary = useGameStore((state) => state.bankSummary)

  const storeLoans = useGameStore((state) => state.bankLoans)

  const storePaidProperties = useGameStore((state) => state.bankPaidProperties)

  const storePayingOffLoanId = useGameStore((state) => state.payingOffLoanId)

  const payOffLoan = useGameStore((state) => state.payOffLoan)

  const news = useGameStore((state) => state.news)

  const inventoryItems = useGameStore((state) => state.inventoryItems)

  const turn = useGameStore((state) => state.turn)

  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent)

  const propertySlots = useGameStore((state) => state.propertySlots)

  const balance = balanceProp ?? storeBalance

  const creditRating = creditRatingProp ?? storeCreditRating

  const summary = summaryProp ?? storeSummary

  const loans = loansProp ?? storeLoans

  const paidProperties = paidPropertiesProp ?? storePaidProperties

  const payingOffLoanId = payingOffLoanIdProp ?? storePayingOffLoanId

  const onPayOff = onPayOffProp ?? payOffLoan

  const [payoffLoanId, setPayoffLoanId] = useState<string | null>(null)

  const payoffLoan = useMemo(

    () => loans.find((loan) => loan.id === payoffLoanId) ?? null,

    [loans, payoffLoanId],

  )

  const operationHistory = useMemo(

    () => buildPropertyOperationHistory(news, inventoryItems, turn, bankBaseRatePercent),

    [news, inventoryItems, turn, bankBaseRatePercent],

  )

  const hasUnlockedPropertySlots = propertySlots.some((slot) => !slot.isLocked)



  return (
    <div className="bank-page flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="bank-page-header mb-4">

        <div className="bank-page-header__divider" aria-hidden />

        <div className="bank-page-header__content">

          <h2 className="bank-page-header__title">Банк</h2>

          <span

            className={`bank-page-header__rating rounded-xl border px-2.5 py-0.5 text-[11px] font-bold ${creditRatingBadgeClass(creditRating)}`}

          >

            Кредитный рейтинг: {creditRating}

          </span>

        </div>

        <div className="bank-page-header__divider bank-page-header__divider--reverse" aria-hidden />

      </header>



      <div className="bank-summary-grid mb-4">

        <SummaryCard

          label="Общий долг"

          value={<MoneyValue amount={summary.totalDebt} size="md" color="red" className="inline-flex" />}

        />

        <SummaryCard

          label="Платёж / ход"

          value={

            <MoneyValue amount={summary.paymentPerTurn} size="md" color="white" className="inline-flex" />

          }

        />

      </div>



      <div className="bank-content min-h-0 flex-1">
        <div className="bank-content__upper">
          {loans.length > 0 ? (
            <section>
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
                    onOpenPayoff={() => setPayoffLoanId(loan.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="bank-section-header">
              <div className="bank-section-header__divider" aria-hidden />
              <h3 className="bank-section-title">Имущество</h3>
              <div className="bank-section-header__divider bank-section-header__divider--reverse" aria-hidden />
            </div>
            {!hasUnlockedPropertySlots ? (
              <EmptyPropertyPlaceholder />
            ) : (
              <BankPropertySlotsGrid
                slots={propertySlots}
                inventoryItems={inventoryItems}
                paidProperties={paidProperties}
                loans={loans}
              />
            )}
          </section>
        </div>

        <section className="bank-history">
          <div className="bank-section-header">
            <div className="bank-section-header__divider" aria-hidden />
            <h3 className="bank-section-title">История операций</h3>
            <div className="bank-section-header__divider bank-section-header__divider--reverse" aria-hidden />
          </div>
          <div className={`bank-history__scroll ${theme.scrollArea}`}>
            <BankOperationHistoryList operations={operationHistory} />
          </div>
        </section>
      </div>



      <BankPayoffModal

        open={payoffLoan != null}

        loan={payoffLoan}

        balance={balance}

        busy={payoffLoan != null && payingOffLoanId === payoffLoan.id}

        onClose={() => setPayoffLoanId(null)}

        onConfirm={(loanId, payPercent) => {

          void Promise.resolve(onPayOff(loanId, payPercent)).finally(() => setPayoffLoanId(null))

        }}

      />

    </div>

  )

}

