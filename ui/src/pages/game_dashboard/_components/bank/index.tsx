import type { ReactNode } from 'react'
import { MoneyValue, formatMoney } from '../../../../components/money/money_value'
import { GameButton } from '../../../../components/game_ui/game_button'
import { ClockIcon } from '../../../../shared/icons'
import { useGameStore } from '../../../../stores/game.store'
import { SegmentBar } from '../shared'
import { getRealEstateImage } from '../../../../constants/realEstateImages'

export interface ActiveLoan {
  id: string
  itemRef: string
  name: string
  initialDebt: number
  remainingDebt: number
  paymentPerTurn: number
}

export interface BankSummary {
  totalDebt: number
  paymentPerTurn: number
  turnsUntilNextCharge: number
}

export const MOCK_BANK_SUMMARY: BankSummary = {
  totalDebt: 450_000,
  paymentPerTurn: 5_200,
  turnsUntilNextCharge: 2,
}

export const MOCK_ACTIVE_LOANS: ActiveLoan[] = [
  {
    id: 'loan-garage',
    itemRef: 'garage',
    name: 'Гараж',
    initialDebt: 180_000,
    remainingDebt: 150_000,
    paymentPerTurn: 4_200,
  },
  {
    id: 'loan-apartment',
    itemRef: 'apartment',
    name: 'Квартира',
    initialDebt: 800_000,
    remainingDebt: 300_000,
    paymentPerTurn: 1_000,
  },
]

const SECONDARY_TEXT = 'text-slate-400'

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
  icon,
}: {
  label: string
  value: ReactNode
  valueClass?: string
  icon?: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-slate-700/50 bg-slate-800/60 px-4 py-3 shadow-lg shadow-black/25 ring-1 ring-slate-700/30">
      <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>{label}</p>
      <div className={`mt-1 flex items-center gap-1.5 text-lg font-bold tabular-nums ${valueClass ?? ''}`}>
        {icon}
        {value}
      </div>
    </div>
  )
}

function ActiveLoanCard({
  loan,
  balance,
  onPayOff,
}: {
  loan: ActiveLoan
  balance: number
  onPayOff?: (loanId: string) => void
}) {
  const image = getRealEstateImage(loan.itemRef)
  const paidProgress = Math.min(
    100,
    Math.round(((loan.initialDebt - loan.remainingDebt) / loan.initialDebt) * 100),
  )
  const canPayOff = balance >= loan.remainingDebt

  return (
    <article className="rounded-3xl border border-slate-700/50 bg-slate-800/50 p-4 ring-1 ring-slate-700/25 transition hover:border-emerald-400/15 hover:bg-slate-800/70">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-900 ring-1 ring-slate-700/40">
          {image ? (
            <img src={image} alt={loan.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-slate-500">{loan.name}</div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h4 className="text-base font-bold text-white">{loan.name}</h4>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className={SECONDARY_TEXT}>
                Остаток:{' '}
                <MoneyValue amount={loan.remainingDebt} size="sm" color="red" className="inline-flex" />
              </span>
              <span className={SECONDARY_TEXT}>
                Платёж / ход:{' '}
                <MoneyValue amount={loan.paymentPerTurn} size="sm" className="inline-flex" />
              </span>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[10px]">
              <span className={SECONDARY_TEXT}>Погашено</span>
              <span className="font-bold text-emerald-400/90">{paidProgress}%</span>
            </div>
            <SegmentBar percent={paidProgress} variant="emerald" className="mt-0.5" />
          </div>
        </div>

        <GameButton
          size="sm"
          disabled={!canPayOff}
          onClick={() => onPayOff?.(loan.id)}
          title={
            canPayOff
              ? `Погасить долг ${formatMoney(loan.remainingDebt)}`
              : `Недостаточно средств (нужно ${formatMoney(loan.remainingDebt)})`
          }
        >
          Погасить
        </GameButton>
      </div>
    </article>
  )
}

interface BankViewProps {
  balance?: number
  creditRating?: string
  summary?: BankSummary
  loans?: ActiveLoan[]
  onPayOff?: (loanId: string) => void
}

export function BankView({
  balance: balanceProp,
  creditRating: creditRatingProp,
  summary: summaryProp,
  loans: loansProp,
  onPayOff: onPayOffProp,
}: BankViewProps = {}) {
  const storeBalance = useGameStore((state) => state.balance)
  const storeCreditRating = useGameStore((state) => state.creditRating)
  const storeSummary = useGameStore((state) => state.bankSummary)
  const storeLoans = useGameStore((state) => state.bankLoans)
  const payOffLoan = useGameStore((state) => state.payOffLoan)

  const balance = balanceProp ?? storeBalance
  const creditRating = creditRatingProp ?? storeCreditRating
  const summary = summaryProp ?? storeSummary
  const loans = loansProp ?? storeLoans
  const onPayOff = onPayOffProp ?? payOffLoan
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Банк</h2>
          <span
            className={`rounded-2xl border px-3 py-1 text-xs font-bold ${creditRatingBadgeClass(creditRating)}`}
          >
            Кредитный рейтинг: {creditRating}
          </span>
        </div>
        <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
          {loans.length} кредитов
        </span>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <SummaryCard
          label="Общий долг"
          value={<MoneyValue amount={summary.totalDebt} size="lg" color="red" />}
        />
        <SummaryCard
          label="Платёж / ход"
          value={<MoneyValue amount={summary.paymentPerTurn} size="lg" />}
        />
        <SummaryCard
          label="Следующее списание через"
          value={`${summary.turnsUntilNextCharge} хода`}
          valueClass="text-white"
          icon={<ClockIcon className="h-4 w-4 shrink-0 text-emerald-400" />}
        />
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-white">Активные кредиты</h3>
        <span className={`inline-flex items-center gap-1.5 text-xs ${SECONDARY_TEXT}`}>
          Доступно: <MoneyValue amount={balance} size="xs" color="amber" className="inline-flex" />
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
        {loans.length === 0 ? (
          <div className="flex min-h-[10rem] flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-400/20 bg-slate-800/30 p-8 text-center">
            <p className="text-lg font-bold text-white">Нет активных кредитов</p>
            <p className={`mt-2 text-sm ${SECONDARY_TEXT}`}>Вся задолженность погашена</p>
          </div>
        ) : (
          loans.map((loan) => (
            <ActiveLoanCard
              key={loan.id}
              loan={loan}
              balance={balance}
              onPayOff={onPayOff}
            />
          ))
        )}
      </div>
    </div>
  )
}
