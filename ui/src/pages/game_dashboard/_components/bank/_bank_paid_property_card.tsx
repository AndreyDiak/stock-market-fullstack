import { useState, type KeyboardEvent } from 'react'
import { MoneyValue } from '../../../../components/money/money_value'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { CategoryChip, DashboardCard, StatusBadge } from '../shared'
import { BankCommercialBadge, BankCommercialIncomeChip } from './_bank_commercial_income_highlight'
import { BankPaidPropertyModal } from './_bank_paid_property_modal'
import { BankPropertyOpenHint } from './_bank_property_open_hint'
import { BankPropertyPreview } from './_bank_property_preview'
import {
  buildPropertyFinanceSummary,
  formatFinalDeltaLabel,
} from './_bank_property_finance_summary'
import type { PaidProperty } from './index'

function openOnKeyboard(event: KeyboardEvent, onOpen: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onOpen()
  }
}

export function BankPaidPropertyCard({ property }: { property: PaidProperty }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const isCommercial = property.passiveIncome > 0

  const financeSummary = buildPropertyFinanceSummary({
    itemRef: property.itemRef,
    dealPrice: property.purchasePrice,
    totalPaid: property.totalPaid,
    purchaseTurn: property.purchaseTurn,
    details: property.details,
    wasInstallment: property.wasInstallment,
  })

  const openDetails = () => {
    gameAudio.playSfx('buttonClick')
    setDetailsOpen(true)
  }

  return (
    <>
      <DashboardCard
        as="article"
        role="button"
        tabIndex={0}
        aria-label={`Подробнее: ${property.name}`}
        onClick={openDetails}
        onKeyDown={(event) => openOnKeyboard(event, openDetails)}
        className={`bank-paid-card bank-paid-card--interactive overflow-visible${isCommercial ? ' bank-paid-card--commercial' : ''}`}
      >
        <div className="bank-paid-card__body">
          <BankPropertyPreview itemRef={property.itemRef} name={property.name} size="paid" />

          <div className="bank-paid-card__main">
            <div className="bank-paid-card__title-row">
              <h4 className="bank-paid-card__title">{property.name}</h4>
              <span className="bank-paid-card__open-hint" aria-hidden>
                <BankPropertyOpenHint />
              </span>
            </div>

            <div className="bank-mortgage-card__badges bank-paid-card__status">
              <StatusBadge tone="emerald" className="uppercase tracking-wide">Куплено</StatusBadge>
              {isCommercial ? <BankCommercialBadge /> : null}
              <BankCommercialIncomeChip amount={property.passiveIncome} />
            </div>

            {property.description ? (
              <p className="bank-paid-card__description">{property.description}</p>
            ) : null}

            <div className="bank-paid-card__stats">
              <div>
                <p className="bank-paid-card__stat-label">Цена покупки</p>
                <MoneyValue
                  amount={property.purchasePrice}
                  size="sm"
                  color="amber"
                  className="bank-paid-card__stat-value"
                />
              </div>

              <div>
                <p className="bank-paid-card__stat-label">Способ оплаты</p>
                <div className="bank-paid-card__stat-value">
                  <CategoryChip>{property.paymentLabel}</CategoryChip>
                </div>
              </div>

              {property.wasInstallment ? (
                <div>
                  <p className="bank-paid-card__stat-label">Всего выплачено</p>
                  <MoneyValue amount={property.totalPaid} size="sm" className="bank-paid-card__stat-value" />
                </div>
              ) : null}

              <div>
                <p className="bank-paid-card__stat-label">
                  {financeSummary.finalDelta != null
                    ? formatFinalDeltaLabel(financeSummary.finalDelta)
                    : 'Итог'}
                </p>
                {financeSummary.finalDelta != null ? (
                  financeSummary.finalDelta === 0 ? (
                    <span className="bank-paid-card__stat-text">По рынку</span>
                  ) : (
                    <MoneyValue
                      amount={Math.abs(financeSummary.finalDelta)}
                      size="sm"
                      color={financeSummary.finalDelta < 0 ? 'emerald' : 'red'}
                      prefix={financeSummary.finalDelta < 0 ? '−' : '+'}
                      className="bank-paid-card__stat-value"
                    />
                  )
                ) : (
                  <span className="bank-paid-card__stat-text">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <BankPaidPropertyModal property={detailsOpen ? property : null} onClose={() => setDetailsOpen(false)} />
    </>
  )
}
