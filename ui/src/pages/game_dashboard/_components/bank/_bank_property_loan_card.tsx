import type { ReactNode } from 'react'
import { MoneyValue, formatMoney } from '../../../../components/money/money_value'
import { GameButton } from '../../../../components/game_ui/game_button'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { format_turns_remaining_label } from '../../_model/utils'
import { calcMinPayoffAmount } from './_bank_payoff_utils'
import { BankCommercialBadge, BankCommercialIncomeHighlight } from './_bank_commercial_income_highlight'
import { parseCatalogPassiveIncome } from './_bank_operation_history'
import { BankPropertyPreview } from './_bank_property_preview'
import { CategoryChip, DashboardCard, SegmentBar } from '../shared'
import type { ActiveLoan } from './index'

function StatCell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="bank-loan-card__stat min-w-0">
      <p className="bank-loan-card__stat-label">{label}</p>
      <div className="bank-loan-card__stat-value">{children}</div>
    </div>
  )
}

export function BankPropertyLoanCard({
  loan,
  balance,
  busy,
  canOpenPayoff,
  onOpenPayoff,
}: {
  loan: ActiveLoan
  balance: number
  busy?: boolean
  canOpenPayoff?: boolean
  onOpenPayoff?: () => void
}) {
  const canPayOff = canOpenPayoff ?? balance >= calcMinPayoffAmount(loan.remainingAmount)
  const passiveIncome = parseCatalogPassiveIncome(loan.itemRef)
  const isCommercial = passiveIncome > 0

  return (
    <DashboardCard
      as="article"
      className={`bank-loan-card overflow-visible !p-3 md:!p-4${isCommercial ? ' bank-loan-card--commercial' : ''}`}
    >
      <div className="bank-loan-card__body">
        <BankPropertyPreview itemRef={loan.itemRef} name={loan.name} size="loan" />

        <div className="bank-loan-card__main">
          <div className="bank-loan-card__header">
            <div className="min-w-0 flex-1">
              <div className="bank-loan-card__title-row">
                <h4 className="bank-loan-card__title">{loan.name}</h4>
                <CategoryChip>Ипотека</CategoryChip>
                {isCommercial ? <BankCommercialBadge /> : null}
              </div>

              <p className="bank-loan-card__subtitle">
                {format_turns_remaining_label(loan.turnsRemaining)}
              </p>

              <p className="bank-loan-card__meta">
                Цена покупки:{' '}
                <MoneyValue amount={loan.purchasePrice} size="xs" color="amber" className="inline-flex" />
              </p>

              <BankCommercialIncomeHighlight amount={passiveIncome} compact />
            </div>
          </div>

          <div className="bank-loan-card__stats">
            <StatCell label="Выплачено">
              <MoneyValue amount={loan.paidAmount} size="sm" color="emerald" className="inline-flex" />
            </StatCell>
            <StatCell label="Осталось">
              <MoneyValue amount={loan.remainingAmount} size="sm" color="red" className="inline-flex" />
            </StatCell>
            <StatCell label="Платёж / ход">
              <MoneyValue amount={loan.paymentPerTurn} size="sm" color="amber" className="inline-flex" />
            </StatCell>
            <StatCell label="Прогресс">
              <span className="text-emerald-400">{loan.paybackPct}%</span>
            </StatCell>
          </div>
        </div>
      </div>

      <div className="bank-loan-card__footer">
        <div className="bank-loan-card__progress">
          <div className="bank-loan-card__progress-head">
            <span className="bank-loan-card__progress-label">Прогресс погашения</span>
            <span className="bank-loan-card__progress-percent">{loan.paybackPct}%</span>
          </div>
          <SegmentBar percent={loan.paybackPct} variant="emerald" heightClass="h-1.5" className="gap-0.5" />
        </div>

        <GameButton
          variant="emerald"
          size="sm"
          disabled={!canPayOff || busy}
          onClick={() => {
            gameAudio.playSfx('buttonClick')
            onOpenPayoff?.()
          }}
          title={
            canPayOff
              ? 'Выбрать сумму досрочного погашения'
              : `Недостаточно средств (минимум ${formatMoney(calcMinPayoffAmount(loan.remainingAmount))})`
          }
          className="w-full shrink-0 shadow-[0_3px_0_#047857,inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_0_#047857,0_0_14px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:shadow-[0_3px_0_#0f172a] disabled:hover:shadow-[0_3px_0_#0f172a] sm:w-auto"
        >
          Досрочное погашение
        </GameButton>
      </div>
    </DashboardCard>
  )
}
