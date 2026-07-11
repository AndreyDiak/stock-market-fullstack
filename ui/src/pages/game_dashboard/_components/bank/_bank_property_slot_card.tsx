import { LockIcon, PropertySlotIcon } from '../../../../shared/icons'
import { DashboardCard } from '../shared'

export function BankEmptyPropertySlot() {
  return (
    <DashboardCard as="article" className="bank-slot-card bank-slot-card--empty">
      <div className="bank-slot-card__inner">
        <div className="bank-slot-card__icon-wrap" aria-hidden>
          <PropertySlotIcon className="bank-slot-card__icon" />
        </div>
        <p className="bank-slot-card__label">Свободный слот</p>
        <p className="bank-slot-card__hint">Можно купить на рынке</p>
      </div>
    </DashboardCard>
  )
}

export function BankLockedPropertySlot() {
  return (
    <DashboardCard as="article" className="bank-slot-card bank-slot-card--locked">
      <div className="bank-slot-card__inner">
        <LockIcon className="bank-slot-card__lock-icon" aria-hidden />
        <p className="bank-slot-card__label">Заблокировано</p>
        <p className="bank-slot-card__hint">Улучшите навык слотов</p>
      </div>
    </DashboardCard>
  )
}
