import { useMemo, useState, type KeyboardEvent } from 'react'
import { MoneyValue } from '../../../../components/money/money_value'
import { gameAudio } from '../../../../lib/audio/game_audio'
import { useGameStore } from '../../../../stores/game.store'
import { CategoryChip, DashboardCard } from '../shared'
import { BankCommercialBadge, BankCommercialIncomeChip } from './_bank_commercial_income_highlight'
import { mapMortgagePropertyDetails } from './_bank_mappers'
import { BankMortgagePropertyModal } from './_bank_mortgage_property_modal'
import { parseCatalogPassiveIncome } from './_bank_operation_history'
import { BankPropertyOpenHint } from './_bank_property_open_hint'
import { BankPropertyPreview } from './_bank_property_preview'
import type { ActiveLoan } from './index'

function openOnKeyboard(event: KeyboardEvent, onOpen: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    onOpen()
  }
}

export function BankMortgagePropertyCard({ loan }: { loan: ActiveLoan }) {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const inventoryItems = useGameStore((state) => state.inventoryItems)
  const news = useGameStore((state) => state.news)
  const turn = useGameStore((state) => state.turn)
  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent)

  const passiveIncome = parseCatalogPassiveIncome(loan.itemRef)
  const isCommercial = passiveIncome > 0

  const propertyDetails = useMemo(() => {
    const inventoryItem = inventoryItems.find((item) => item.id === loan.id)
    return mapMortgagePropertyDetails(loan, inventoryItem, news, bankBaseRatePercent, turn)
  }, [loan, inventoryItems, news, bankBaseRatePercent, turn])

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
        aria-label={`Подробнее: ${loan.name}`}
        onClick={openDetails}
        onKeyDown={(event) => openOnKeyboard(event, openDetails)}
        className={`bank-paid-card bank-mortgage-card bank-paid-card--interactive overflow-visible${isCommercial ? ' bank-paid-card--commercial' : ''}`}
      >
        <div className="bank-paid-card__body">
          <BankPropertyPreview itemRef={loan.itemRef} name={loan.name} size="paid" />

          <div className="bank-paid-card__main">
            <div className="bank-paid-card__title-row">
              <h4 className="bank-paid-card__title">{loan.name}</h4>
              <span className="bank-paid-card__open-hint" aria-hidden>
                <BankPropertyOpenHint />
              </span>
            </div>

            <div className="bank-mortgage-card__badges">
              <CategoryChip>ИПОТЕКА</CategoryChip>
              {isCommercial ? <BankCommercialBadge /> : null}
              <BankCommercialIncomeChip amount={passiveIncome} />
            </div>

            {propertyDetails.description ? (
              <p className="bank-paid-card__description">{propertyDetails.description}</p>
            ) : null}

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
                <p className="bank-paid-card__stat-label">Выплачено</p>
                <div className="bank-mortgage-card__paid-value">
                  <MoneyValue amount={loan.paidAmount} size="sm" color="emerald" className="inline-flex" />
                  <span className="bank-mortgage-card__paid-pct">{loan.paybackPct}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>

      <BankMortgagePropertyModal
        property={detailsOpen ? propertyDetails : null}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  )
}
