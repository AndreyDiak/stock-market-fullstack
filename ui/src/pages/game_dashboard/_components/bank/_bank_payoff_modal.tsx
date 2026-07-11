import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { AssetImageFrame } from '../../../../shared/components'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { format_turns_remaining_label } from '../../_model/utils'
import type { ActiveLoan } from './index'
import {
  PAYOFF_PERCENT_MAX,
  PAYOFF_PERCENT_MIN,
  PAYOFF_PERCENT_STEP,
  calcInstallmentEarlyPayAmount,
  calcMaxAffordablePayoffPercent,
  calcMinPayoffAmount,
  normalizePayoffPercent,
} from './_bank_payoff_utils'
import '../real_estate/_negotiate_modal.css'
import './_bank_payoff_modal.css'

interface BankPayoffModalProps {
  open: boolean
  loan: ActiveLoan | null
  balance: number
  busy?: boolean
  onClose: () => void
  onConfirm: (loanId: string, payPercent: number) => void
}

export function BankPayoffModal({
  open,
  loan,
  balance,
  busy = false,
  onClose,
  onConfirm,
}: BankPayoffModalProps) {
  const maxPercent = useMemo(
    () => (loan ? calcMaxAffordablePayoffPercent(loan.remainingAmount, balance) : 0),
    [balance, loan],
  )
  const canPayFull = loan != null && balance >= loan.remainingAmount
  const canPayPartial = maxPercent >= PAYOFF_PERCENT_MIN

  const [payPercent, setPayPercent] = useState(PAYOFF_PERCENT_MAX)

  useEffect(() => {
    if (!open || !loan) return
    setPayPercent(canPayFull ? PAYOFF_PERCENT_MAX : maxPercent)
  }, [canPayFull, loan?.id, maxPercent, open])

  if (!loan) return null

  const paymentAmount = calcInstallmentEarlyPayAmount(loan.remainingAmount, payPercent, balance)
  const remainingAfter = Math.max(0, loan.remainingAmount - paymentAmount)
  const turnsAfter =
    remainingAfter > 0 && loan.paymentPerTurn > 0
      ? Math.ceil(remainingAfter / loan.paymentPerTurn)
      : 0
  const sliderMax = Math.max(PAYOFF_PERCENT_MIN, maxPercent)
  const sliderValue = Math.min(payPercent, sliderMax)
  const sliderPct =
    sliderMax <= PAYOFF_PERCENT_MIN
      ? 100
      : ((sliderValue - PAYOFF_PERCENT_MIN) / (sliderMax - PAYOFF_PERCENT_MIN)) * 100
  const canConfirm = canPayPartial && paymentAmount > 0 && balance >= paymentAmount && !busy

  return (
    <GameModal
      open={open}
      onClose={onClose}
      labelledBy="bank-payoff-title"
      panelClassName="bank-payoff-modal pointer-events-auto relative w-full max-w-md outline-none"
    >
      <div className="bank-payoff-modal__shell">
        <header className="bank-payoff-modal__header">
          <p className="bank-payoff-modal__eyebrow">Досрочное погашение</p>
          <h3 id="bank-payoff-title" className="bank-payoff-modal__title">
            {loan.name}
          </h3>
          <p className="bank-payoff-modal__subtitle">
            Выберите сумму выплаты — шаг {PAYOFF_PERCENT_STEP}% от остатка долга
          </p>
        </header>

        <div className="bank-payoff-modal__asset">
          <AssetImageFrame
            assetId={loan.itemRef}
            alt={loan.name}
            width="3.5rem"
            height="3.5rem"
            fallback={<span aria-hidden>🏠</span>}
          />
          <div className="bank-payoff-modal__asset-meta">
            <span className="bank-payoff-modal__asset-name">{loan.name}</span>
            <span className="bank-payoff-modal__asset-debt">
              Остаток:{' '}
              <MoneyValue amount={loan.remainingAmount} size="sm" color="red" className="inline-flex" />
            </span>
          </div>
        </div>

        {canPayFull ? (
          <button
            type="button"
            className={`bank-payoff-modal__full-option${
              payPercent >= PAYOFF_PERCENT_MAX ? ' bank-payoff-modal__full-option--active' : ''
            }`}
            onClick={() => {
              gameAudio.playSfx('buttonClick')
              setPayPercent(PAYOFF_PERCENT_MAX)
            }}
          >
            <span className="bank-payoff-modal__full-option-label">Погасить полностью</span>
            <MoneyValue amount={loan.remainingAmount} size="md" color="emerald" />
          </button>
        ) : null}

        <div className="trade-modal__slider-panel bank-payoff-modal__slider-panel">
          <div className="trade-modal__slider-header">
            <span className="trade-modal__slider-label">Сумма выплаты</span>
            <MoneyValue amount={paymentAmount} size="md" color="amber" className="trade-modal__slider-value" />
          </div>

          <div className="trade-modal__slider-body">
            <div className="trade-modal__slider-track-wrap">
              <div className="trade-modal__slider-track" aria-hidden />
              <input
                type="range"
                min={canPayPartial ? PAYOFF_PERCENT_MIN : 0}
                max={sliderMax}
                step={PAYOFF_PERCENT_STEP}
                value={sliderValue}
                disabled={!canPayPartial || busy}
                onChange={(event) => setPayPercent(Number(event.target.value))}
                className="trade-modal__slider-input"
                style={{ '--slider-pct': `${sliderPct}%` } as CSSProperties}
                aria-valuemin={PAYOFF_PERCENT_MIN}
                aria-valuemax={maxPercent}
                aria-valuenow={payPercent}
                aria-label="Процент от остатка долга"
              />
            </div>
            <div className="trade-modal__slider-ends" aria-hidden>
              <span>{PAYOFF_PERCENT_MIN}%</span>
              <span>{sliderMax}%</span>
            </div>
          </div>
        </div>

        <div className="bank-payoff-modal__summary">
          <div className="bank-payoff-modal__summary-row">
            <span>К выплате сейчас</span>
            <MoneyValue amount={paymentAmount} size="sm" color="amber" />
          </div>
          <div className="bank-payoff-modal__summary-row">
            <span>Останется после</span>
            <MoneyValue amount={remainingAfter} size="sm" color="white" />
          </div>
          <div className="bank-payoff-modal__summary-row">
            <span>Доступно на балансе</span>
            <MoneyValue amount={balance} size="sm" color="emerald" />
          </div>
          {remainingAfter > 0 && turnsAfter > 0 ? (
            <p className="bank-payoff-modal__summary-note">
              Примерный срок после выплаты: {format_turns_remaining_label(turnsAfter)}
            </p>
          ) : null}
        </div>

        {!canPayPartial ? (
          <p className="bank-payoff-modal__alert" role="alert">
            Недостаточно средств даже для минимальной выплаты (
            {calcMinPayoffAmount(loan.remainingAmount).toLocaleString('ru-RU')})
          </p>
        ) : null}

        <footer className="bank-payoff-modal__footer">
          <GameButton
            variant="muted"
            size="sm"
            fullWidth
            disabled={busy}
            onClick={onClose}
            className="trade-modal__footer-btn trade-modal__footer-btn--cancel"
          >
            Отмена
          </GameButton>
          <GameButton
            variant="emerald"
            size="sm"
            fullWidth
            disabled={!canConfirm}
            onClick={() => onConfirm(loan.id, normalizePayoffPercent(payPercent))}
            className="trade-modal__footer-btn trade-modal__confirm-btn"
          >
            {payPercent >= PAYOFF_PERCENT_MAX && canPayFull ? 'Погасить полностью' : 'Выплатить'}
          </GameButton>
        </footer>
      </div>
    </GameModal>
  )
}
