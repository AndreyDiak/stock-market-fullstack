import { MoneyValue } from '../../../../components/money/money_value'
import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate'
import { CategoryChip, DashboardCard, SegmentBar, StatusBadge } from '../shared'
import { BankCommercialBadge, BankCommercialIncomeHighlight } from './_bank_commercial_income_highlight'
import { parseCatalogPassiveIncome } from './_bank_operation_history'
import { BankPropertyPreview } from './_bank_property_preview'
import type { ActiveLoan } from './index'

export function BankMortgagePropertyCard({ loan }: { loan: ActiveLoan }) {
  const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === loan.itemRef)
  const description = catalog?.description ?? null
  const passiveIncome = parseCatalogPassiveIncome(loan.itemRef)
  const isCommercial = passiveIncome > 0

  return (
    <DashboardCard
      as="article"
      className={`bank-paid-card bank-mortgage-card overflow-visible${isCommercial ? ' bank-paid-card--commercial' : ''}`}
    >
      <div className="bank-paid-card__body">
        <BankPropertyPreview itemRef={loan.itemRef} name={loan.name} size="paid" />

        <div className="bank-paid-card__main">
          <h4 className="bank-paid-card__title">{loan.name}</h4>

          <div className="bank-mortgage-card__badges">
            <StatusBadge tone="sky">Ипотека</StatusBadge>
            <CategoryChip>В кредит</CategoryChip>
            {isCommercial ? <BankCommercialBadge /> : null}
          </div>

          {description ? <p className="bank-paid-card__description">{description}</p> : null}

          <BankCommercialIncomeHighlight amount={passiveIncome} />

          <div className="bank-paid-card__stats">
            <div>
              <p className="bank-paid-card__stat-label">Цена покупки</p>
              <MoneyValue
                amount={loan.purchasePrice}
                size="sm"
                color="amber"
                className="bank-paid-card__stat-value"
              />
            </div>

            <div>
              <p className="bank-paid-card__stat-label">Остаток</p>
              <MoneyValue
                amount={loan.remainingAmount}
                size="sm"
                color="red"
                className="bank-paid-card__stat-value"
              />
            </div>

            <div>
              <p className="bank-paid-card__stat-label">Платёж / ход</p>
              <MoneyValue
                amount={loan.paymentPerTurn}
                size="sm"
                className="bank-paid-card__stat-value"
              />
            </div>

            <div>
              <p className="bank-paid-card__stat-label">Осталось ходов</p>
              <span className="bank-paid-card__stat-text">{loan.turnsRemaining}</span>
            </div>
          </div>

          <div className="bank-mortgage-card__progress">
            <div className="bank-mortgage-card__progress-head">
              <span className="bank-paid-card__stat-label">Выплачено</span>
              <span className="bank-mortgage-card__progress-value">{loan.paybackPct}%</span>
            </div>
            <SegmentBar percent={loan.paybackPct} />
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
