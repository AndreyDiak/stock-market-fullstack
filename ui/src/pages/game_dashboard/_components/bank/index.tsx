import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { MoneyValue } from '../../../../components/money/money_value'
import { useGameStore } from '../../../../stores/game.store'
import { DashboardCard } from '../shared'
import type { CharacterSkill } from '../character/_character_skills'
import { BankHistoryTab } from './_bank_history_tab'
import { buildPropertyOperationHistory } from './_bank_operation_history'
import type { PropertyOperationDetails } from './_bank_operation_history'
import { BankLoansSection } from './_bank_loans_section'
import { BankPayoffModal } from './_bank_payoff_modal'
import { BankPropertyTab } from './_bank_property_tab'
import { BankTabs, type BankTabId } from './_bank_tabs'
import {
  sessionStaggerContainerVariants,
  sessionStaggerItemVariants,
} from '../../../../components/game_ui/session_animations'
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

function getHighestAccessibleGrade(raw: string): string {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return parts[parts.length - 1] ?? 'F'
}

function getBankingInfographicValue(skills: CharacterSkill[], chipId: string): string | null {
  const bankingSkill = skills.find((skill) => skill.id === 'banking')
  const chip = bankingSkill?.infographic.find((item) => item.id === chipId)
  return chip?.value ?? null
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

function countOccupiedPropertySlots(slots: { isLocked: boolean; item?: unknown }[]) {
  return slots.filter((slot) => !slot.isLocked && slot.item).length
}

interface BankViewProps {
  balance?: number
  summary?: BankSummary
  loans?: ActiveLoan[]
  paidProperties?: PaidProperty[]
  payingOffLoanId?: string | null
  onPayOff?: (loanId: string, payPercent: number) => void
}

export function BankView({
  balance: balanceProp,
  summary: summaryProp,
  loans: loansProp,
  paidProperties: paidPropertiesProp,
  payingOffLoanId: payingOffLoanIdProp,
  onPayOff: onPayOffProp,
}: BankViewProps = {}) {
  const storeBalance = useGameStore((state) => state.balance)
  const storeSummary = useGameStore((state) => state.bankSummary)
  const storeLoans = useGameStore((state) => state.bankLoans)
  const storePaidProperties = useGameStore((state) => state.bankPaidProperties)
  const storePayingOffLoanId = useGameStore((state) => state.payingOffLoanId)
  const payOffLoan = useGameStore((state) => state.payOffLoan)
  const news = useGameStore((state) => state.news)
  const inventoryItems = useGameStore((state) => state.inventoryItems)
  const turn = useGameStore((state) => state.turn)
  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent)
  const characterSkills = useGameStore((state) => state.characterSkills)
  const propertySlots = useGameStore((state) => state.propertySlots)

  const balance = balanceProp ?? storeBalance
  const summary = summaryProp ?? storeSummary
  const loans = loansProp ?? storeLoans
  const paidProperties = paidPropertiesProp ?? storePaidProperties
  const payingOffLoanId = payingOffLoanIdProp ?? storePayingOffLoanId
  const onPayOff = onPayOffProp ?? payOffLoan

  const [activeTab, setActiveTab] = useState<BankTabId>('property')
  const [payoffLoanId, setPayoffLoanId] = useState<string | null>(null)

  const payoffLoan = useMemo(
    () => loans.find((loan) => loan.id === payoffLoanId) ?? null,
    [loans, payoffLoanId],
  )

  const operationHistory = useMemo(
    () => buildPropertyOperationHistory(news, inventoryItems, turn, bankBaseRatePercent),
    [news, inventoryItems, turn, bankBaseRatePercent],
  )

  const propertyDealGrade = useMemo(() => {
    const raw = getBankingInfographicValue(characterSkills, 'property-deals') ?? 'F'
    return getHighestAccessibleGrade(raw)
  }, [characterSkills])

  const hasUnlockedPropertySlots = propertySlots.some((slot) => !slot.isLocked)
  const occupiedCount = countOccupiedPropertySlots(propertySlots)
  const propertyTabLabel = `Имущество ${occupiedCount}/${propertySlots.length}`

  return (
    <div className="bank-page flex min-h-0 flex-1 flex-col overflow-hidden">
      <motion.div
        className="flex min-h-0 flex-1 flex-col gap-3"
        variants={sessionStaggerContainerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={sessionStaggerItemVariants}>
          <header className="bank-page-header">
            <div className="bank-page-header__divider" aria-hidden />
            <div className="bank-page-header__content">
              <h2 className="bank-page-header__title">Банк</h2>
            </div>
            <div className="bank-page-header__divider bank-page-header__divider--reverse" aria-hidden />
          </header>
        </motion.div>

        <motion.div variants={sessionStaggerItemVariants}>
          <div className="bank-summary-grid">
            <SummaryCard
              label="Общий долг"
              value={<MoneyValue amount={summary.totalDebt} size="md" color="red" className="inline-flex" />}
            />
            <SummaryCard
              label="Платёж / ход"
              value={<MoneyValue amount={summary.paymentPerTurn} size="md" color="white" className="inline-flex" />}
            />
            <SummaryCard
              label="Процент кредита"
              value={<span className="text-sky-300">{bankBaseRatePercent}%</span>}
            />
            <SummaryCard
              label="Сделки с имуществом"
              value={<span className="text-amber-300">{propertyDealGrade}</span>}
            />
          </div>
        </motion.div>

        {loans.length > 0 && (
          <motion.div variants={sessionStaggerItemVariants}>
            <BankLoansSection
              loans={loans}
              balance={balance}
              payingOffLoanId={payingOffLoanId}
              onOpenPayoff={setPayoffLoanId}
            />
          </motion.div>
        )}

        <motion.div variants={sessionStaggerItemVariants}>
          <BankTabs active={activeTab} onChange={setActiveTab} propertyLabel={propertyTabLabel} />
        </motion.div>

        <motion.div variants={sessionStaggerItemVariants}>
          <div className="bank-tab-panel" role="tabpanel">
            <AnimatePresence mode="wait">
              {activeTab === 'property' ? (
                <motion.div
                  key="property"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                >
                  <BankPropertyTab
                    hasUnlockedPropertySlots={hasUnlockedPropertySlots}
                    propertySlots={propertySlots}
                    inventoryItems={inventoryItems}
                    paidProperties={paidProperties}
                    loans={loans}
                  />
                </motion.div>
              ) : null}

              {activeTab === 'history' ? (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                >
                  <BankHistoryTab operations={operationHistory} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

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
