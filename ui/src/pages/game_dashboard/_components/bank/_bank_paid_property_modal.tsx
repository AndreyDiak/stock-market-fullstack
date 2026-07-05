import { GameModal } from '../../../../components/game_ui/floating'
import { GameButton } from '../../../../components/game_ui/game_button'
import { MoneyValue } from '../../../../components/money/money_value'
import { AssetImageFrame } from '../../../../shared/components'
import { format_turn_step_label } from '../../_model/utils'
import { CategoryChip, StatusBadge } from '../shared'
import { BankCommercialBadge, BankCommercialIncomeHighlight } from './_bank_commercial_income_highlight'
import {
  buildBuyMarketPriceDiff,
  formatOperationPriceDiff,
  resolveCatalogMarketPrice,
} from './_bank_operation_price_diff'
import type { PaidProperty } from './index'
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

export function BankPaidPropertyModal({
  property,
  onClose,
}: {
  property: PaidProperty | null
  onClose: () => void
}) {
  if (!property) return null

  const details = property.details
  const marketPrice = resolveCatalogMarketPrice(property.itemRef)
  const priceDiff = buildBuyMarketPriceDiff(property.purchasePrice, marketPrice)
  const priceDiffView = priceDiff
    ? formatOperationPriceDiff({
        type: 'buy',
        itemRef: property.itemRef,
        price: property.purchasePrice,
        turnStep: property.purchaseTurn,
        priceDiff,
      })
    : null

  return (
    <GameModal
      open={property != null}
      onClose={onClose}
      labelledBy="bank-paid-property-modal-title"
      panelClassName="bank-operation-modal pointer-events-auto relative w-full max-w-md outline-none"
    >
      <div className="bank-operation-modal__shell">
        <header className="bank-operation-modal__header">
          <div className="bank-operation-modal__asset">
            <AssetImageFrame
              assetId={property.itemRef}
              alt={property.name}
              width="5.5rem"
              height="5.5rem"
            />

            <div className="bank-operation-modal__heading">
              <p className="bank-operation-modal__eyebrow">Купленное имущество</p>
              <h3 id="bank-paid-property-modal-title" className="bank-operation-modal__title">
                {property.name}
              </h3>
              <div className="bank-operation-modal__badges">
                <StatusBadge tone="emerald">Куплено</StatusBadge>
                <CategoryChip>{property.paymentLabel}</CategoryChip>
                {property.passiveIncome > 0 ? <BankCommercialBadge /> : null}
              </div>
            </div>
          </div>
        </header>

        {property.description ? (
          <p className="bank-paid-property-modal__description">{property.description}</p>
        ) : null}

        <BankCommercialIncomeHighlight amount={property.passiveIncome} />

        <div className="bank-operation-modal__summary">
          <DetailRow label="Цена покупки">
            <MoneyValue amount={property.purchasePrice} size="sm" color="amber" className="inline-flex" />
          </DetailRow>
          <DetailRow label="Ход покупки">
            <span>{format_turn_step_label(property.purchaseTurn)}</span>
          </DetailRow>
          {property.wasInstallment ? (
            <DetailRow label="Всего выплачено">
              <MoneyValue amount={property.totalPaid} size="sm" color="emerald" className="inline-flex" />
            </DetailRow>
          ) : null}
          {priceDiffView && priceDiff ? (
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
                  amount={Math.abs(priceDiff.amount)}
                  size="sm"
                  color={priceDiffView.tone === 'profit' ? 'emerald' : priceDiffView.tone === 'loss' ? 'red' : 'white'}
                  prefix={priceDiff.amount > 0 ? '+' : priceDiff.amount < 0 ? '−' : ''}
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
            {property.wasInstallment ? (
              <DetailRow label="Переплата">
                <MoneyValue amount={details.overpayment} size="sm" color="amber" className="inline-flex" />
              </DetailRow>
            ) : null}
            <DetailRow label="Ход покупки">
              <span>
                {details.purchaseTurn != null
                  ? format_turn_step_label(details.purchaseTurn)
                  : '—'}
              </span>
            </DetailRow>
            {property.wasInstallment ? (
              <DetailRow label="Ход финальной выплаты">
                <span>
                  {details.finalPaymentTurn != null
                    ? format_turn_step_label(details.finalPaymentTurn)
                    : '—'}
                </span>
              </DetailRow>
            ) : null}
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
