import type { ReactNode } from 'react'
import { MoneyValue, formatMoney } from '../../../../components/money/money_value'
import { GameButton } from '../../../../components/game_ui/game_button'
import { getRealEstateImage } from '../../../../constants/realEstateImages'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { format_turns_remaining_label } from '../../_model/utils'
import { CategoryChip, DashboardCard, SegmentBar } from '../shared'
import type { ActiveLoan } from './index'

const SECONDARY_TEXT = 'text-[var(--text-secondary,#94a3b8)]'

function StatCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bank-loan-card__stat min-w-0">
      <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>{label}</p>
      <div className="mt-0.5 text-sm font-bold tabular-nums text-white">{children}</div>
    </div>
  )
}

export function BankPropertyLoanCard({
  loan,
  balance,
  busy,
  onPayOff,
}: {
  loan: ActiveLoan
  balance: number
  busy?: boolean
  onPayOff?: (loanId: string) => void
}) {
  const image = getRealEstateImage(loan.itemRef)
  const canPayOff = balance >= loan.remainingAmount

  return (
    <DashboardCard as="article" className="bank-loan-card overflow-visible p-0">
      <div className="bank-loan-card__price-band border-b border-[var(--border-subtle)] bg-[var(--surface-inset,rgba(15,23,42,0.35))] px-4 py-2.5 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
            Цена покупки
          </p>
          <MoneyValue amount={loan.purchasePrice} size="md" color="amber" />
        </div>
      </div>

      <div className="p-4 md:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-[var(--border-subtle)]">
            {image ? (
              <img src={image} alt={loan.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`flex h-full items-center justify-center text-[10px] ${SECONDARY_TEXT}`}>
                {loan.name}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white">{loan.name}</h4>
              <CategoryChip>Ипотека</CategoryChip>
            </div>
            <p className={`mt-1 text-xs ${SECONDARY_TEXT}`}>
              {format_turns_remaining_label(loan.turnsRemaining)} · платёж{' '}
              <MoneyValue amount={loan.paymentPerTurn} size="xs" className="inline-flex" /> / ход
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCell label="Выплачено">
            <MoneyValue amount={loan.paidAmount} size="sm" color="emerald" className="inline-flex" />
          </StatCell>
          <StatCell label="Осталось">
            <MoneyValue amount={loan.remainingAmount} size="sm" color="red" className="inline-flex" />
          </StatCell>
          <StatCell label="Срок">
            <span>{format_turns_remaining_label(loan.turnsRemaining)}</span>
          </StatCell>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[10px]">
            <span className={SECONDARY_TEXT}>Прогресс погашения</span>
            <span className="font-bold text-emerald-400/90">{loan.paybackPct}%</span>
          </div>
          <SegmentBar percent={loan.paybackPct} variant="emerald" />
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className={`text-xs ${SECONDARY_TEXT}`}>
            Досрочное погашение:{' '}
            <MoneyValue amount={loan.remainingAmount} size="sm" color="amber" className="inline-flex" />
          </div>

          <GameButton
            variant="emerald"
            size="sm"
            disabled={!canPayOff || busy}
            onClick={() => {
              gameAudio.playSfx('buttonClick')
              onPayOff?.(loan.id)
            }}
            title={
              canPayOff
                ? `Погасить ${formatMoney(loan.remainingAmount)}`
                : `Недостаточно средств (нужно ${formatMoney(loan.remainingAmount)})`
            }
            className="shadow-[0_3px_0_#047857,inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_3px_0_#047857,0_0_14px_rgba(16,185,129,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] disabled:shadow-[0_3px_0_#0f172a] disabled:hover:shadow-[0_3px_0_#0f172a]"
          >
            Досрочное погашение
          </GameButton>
        </div>
      </div>
    </DashboardCard>
  )
}
