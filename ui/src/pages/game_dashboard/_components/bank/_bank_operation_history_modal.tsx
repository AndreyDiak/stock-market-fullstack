import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { AssetImageFrame } from '../../../../shared/components'
import { format_turn_step_label } from '../../_model/utils'
import { StatusBadge } from '../shared'
import type { PropertyOperation } from './_bank_operation_history'
import { formatOperationPriceDiff } from './_bank_operation_price_diff'
import './_bank_operation_history_modal.css'

function DetailRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bank-operation-modal__row">
      <span className="bank-operation-modal__label">{label}</span>
      <div className="bank-operation-modal__value">{children}</div>
    </div>
  )
}

export function BankOperationHistoryModal({
  operation,
  onClose,
}: {
  operation: PropertyOperation | null
  onClose: () => void
}) {
  if (!operation) return null

  const isBuy = operation.type === 'buy'
  const details = operation.details
  const priceDiffView = formatOperationPriceDiff(operation)

  return (
    <GameModal
      open={operation != null}
      onClose={onClose}
      labelledBy="bank-operation-modal-title"
      panelClassName="bank-operation-modal pointer-events-auto relative w-full max-w-md outline-none"
    >
      <div className="bank-operation-modal__shell">
        <header className="bank-operation-modal__header">
          <div className="bank-operation-modal__asset">
            <AssetImageFrame
              assetId={operation.itemRef}
              alt={operation.itemName}
              width="5.5rem"
              height="5.5rem"
            />

            <div className="bank-operation-modal__heading">
              <p className="bank-operation-modal__eyebrow">
                {isBuy ? 'Покупка имущества' : 'Продажа имущества'}
              </p>
              <h3 id="bank-operation-modal-title" className="bank-operation-modal__title">
                {operation.itemName}
              </h3>
              <div className="bank-operation-modal__badges">
                <StatusBadge tone={isBuy ? 'sky' : 'amber'}>
                  {isBuy ? 'Покупка' : 'Продажа'}
                </StatusBadge>
                {operation.paymentLabel ? (
                  <span className="bank-operation-modal__payment-chip">{operation.paymentLabel}</span>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        <div className="bank-operation-modal__summary">
          <DetailRow label={isBuy ? 'Цена покупки' : 'Цена продажи'}>
            <MoneyValue amount={operation.price} size="sm" color="amber" className="inline-flex" />
          </DetailRow>
          <DetailRow label="Ход сделки">
            <span>{format_turn_step_label(operation.turnStep)}</span>
          </DetailRow>
          {priceDiffView && operation.priceDiff ? (
            <DetailRow label={priceDiffView.detailLabel}>
              <div className="bank-operation-modal__price-diff">
                <span
                  className={[
                    'bank-operation-modal__price-diff-percent',
                    `bank-operation-modal__price-diff-percent--${priceDiffView.tone}`,
                  ].join(' ')}
                >
                  {priceDiffView.label}
                </span>
                <MoneyValue
                  amount={Math.abs(operation.priceDiff.amount)}
                  size="sm"
                  color={priceDiffView.tone === 'profit' ? 'emerald' : priceDiffView.tone === 'loss' ? 'red' : 'white'}
                  prefix={operation.priceDiff.amount > 0 ? '+' : operation.priceDiff.amount < 0 ? '−' : ''}
                  className="inline-flex"
                />
              </div>
            </DetailRow>
          ) : null}
        </div>

        {details ? (
          <div className="bank-operation-modal__details">
            <p className="bank-operation-modal__section-title">Финансы сделки</p>
            <DetailRow label="Первый платёж">
              <MoneyValue amount={details.firstPayment} size="sm" className="inline-flex" />
            </DetailRow>
            <DetailRow label="Переплата">
              <MoneyValue amount={details.overpayment} size="sm" color="amber" className="inline-flex" />
            </DetailRow>
            <DetailRow label="Ход покупки">
              <span>
                {details.purchaseTurn != null
                  ? format_turn_step_label(details.purchaseTurn)
                  : '—'}
              </span>
            </DetailRow>
            <DetailRow label="Ход финальной выплаты">
              <span>
                {details.finalPaymentTurn != null
                  ? format_turn_step_label(details.finalPaymentTurn)
                  : '—'}
              </span>
            </DetailRow>
          </div>
        ) : null}

        <footer className="bank-operation-modal__footer">
          <GameButton variant="muted" size="sm" onClick={onClose}>
            Закрыть
          </GameButton>
        </footer>
      </div>
    </GameModal>
  )
}
