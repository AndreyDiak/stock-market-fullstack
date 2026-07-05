import { useState } from 'react'
import { MoneyValue } from '../../../../components/money/money_value'
import { CategoryChip, DashboardCard, StatusBadge } from '../shared'
import { BankCommercialBadge, BankCommercialIncomeHighlight } from './_bank_commercial_income_highlight'
import { BankPaidPropertyModal } from './_bank_paid_property_modal'
import { BankPropertyOpenHint } from './_bank_property_open_hint'
import { BankPropertyPreview } from './_bank_property_preview'
import type { PaidProperty } from './index'

export function BankPaidPropertyCard({ property }: { property: PaidProperty }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const isCommercial = property.passiveIncome > 0

  return (
    <>
      <DashboardCard
        as="article"
        className={`bank-paid-card overflow-visible${isCommercial ? ' bank-paid-card--commercial' : ''}`}
      >
        <div className="bank-paid-card__body">
          <BankPropertyPreview itemRef={property.itemRef} name={property.name} size="paid" />

          <div className="bank-paid-card__main">
            <div className="bank-paid-card__title-row">
              <h4 className="bank-paid-card__title">{property.name}</h4>
              <button
                type="button"
                className="bank-paid-card__open"
                onClick={() => setDetailsOpen(true)}
                aria-label={`Подробнее: ${property.name}`}
              >
                <BankPropertyOpenHint />
              </button>
            </div>

            <div className="bank-mortgage-card__badges bank-paid-card__status">
              <StatusBadge tone="emerald">Куплено</StatusBadge>
              {isCommercial ? <BankCommercialBadge /> : null}
            </div>

            {property.description ? (
              <p className="bank-paid-card__description">{property.description}</p>
            ) : null}

            <BankCommercialIncomeHighlight amount={property.passiveIncome} />

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
                <p className="bank-paid-card__stat-label">Ход покупки</p>
                <span className="bank-paid-card__stat-text">{property.purchasedAtLabel}</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <BankPaidPropertyModal property={detailsOpen ? property : null} onClose={() => setDetailsOpen(false)} />
    </>
  )
}
