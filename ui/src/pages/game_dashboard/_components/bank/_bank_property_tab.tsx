import type { InventoryItemDto } from '../../_model/game_mappers'
import type { PropertySlot } from '../property'
import { BankPropertySlotsGrid } from './_bank_property_slots_grid'
import type { ActiveLoan, PaidProperty } from './index'

function EmptyPropertyPlaceholder() {
  return (
    <div className="bank-empty-state">
      <p className="bank-empty-state__text">Слоты имущества ещё не открыты</p>
    </div>
  )
}

export function BankPropertyTab({
  hasUnlockedPropertySlots,
  propertySlots,
  inventoryItems,
  paidProperties,
  loans,
}: {
  hasUnlockedPropertySlots: boolean
  propertySlots: PropertySlot[]
  inventoryItems: InventoryItemDto[]
  paidProperties: PaidProperty[]
  loans: ActiveLoan[]
}) {
  if (!hasUnlockedPropertySlots) {
    return (
      <div className="bank-tab-panel__inner">
        <EmptyPropertyPlaceholder />
      </div>
    )
  }

  return (
    <div className="bank-tab-panel__inner">
      <BankPropertySlotsGrid
        slots={propertySlots}
        inventoryItems={inventoryItems}
        paidProperties={paidProperties}
        loans={loans}
      />
    </div>
  )
}
