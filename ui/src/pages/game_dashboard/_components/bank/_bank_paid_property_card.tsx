import { MoneyValue } from '../../../../components/money/money_value'
import { getRealEstateImage } from '../../../../constants/realEstateImages'
import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate'
import { CategoryChip, DashboardCard, StatusBadge } from '../shared'
import type { PaidProperty } from './index'

const SECONDARY_TEXT = 'text-[var(--text-secondary,#94a3b8)]'

function parsePassiveIncome(special: string | undefined) {
  if (!special) return 0
  const match = special.match(/(\d+)\/ход/)
  return match ? Number(match[1]) : 0
}

export function BankPaidPropertyCard({ property }: { property: PaidProperty }) {
  const image = getRealEstateImage(property.itemRef)
  const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === property.itemRef)
  const passiveIncome = parsePassiveIncome(catalog?.special)

  return (
    <DashboardCard as="article" className="bank-paid-card overflow-visible p-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-[var(--border-subtle)]">
          {image ? (
            <img src={image} alt={property.name} className="h-full w-full object-cover" />
          ) : (
            <div className={`flex h-full items-center justify-center text-[10px] ${SECONDARY_TEXT}`}>
              {property.name}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-white">{property.name}</h4>
            <StatusBadge tone="emerald">В собственности</StatusBadge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
                Цена покупки
              </p>
              <MoneyValue amount={property.purchasePrice} size="sm" color="amber" className="mt-0.5" />
            </div>

            {property.wasInstallment ? (
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
                  Всего выплачено
                </p>
                <MoneyValue amount={property.totalPaid} size="sm" className="mt-0.5" />
              </div>
            ) : (
              <CategoryChip>Оплачено сразу</CategoryChip>
            )}

            {passiveIncome > 0 ? (
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${SECONDARY_TEXT}`}>
                  Доход
                </p>
                <p className="mt-0.5 text-sm font-bold text-emerald-400">
                  +<MoneyValue amount={passiveIncome} size="sm" color="emerald" className="inline-flex" /> / ход
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardCard>
  )
}
