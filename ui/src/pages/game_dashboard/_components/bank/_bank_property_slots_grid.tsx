import type { InventoryItemDto } from '../../_model/game_mappers'
import type { PropertySlot } from '../property'
import { BankEmptyPropertySlot, BankLockedPropertySlot } from './_bank_property_slot_card'
import { BankMortgagePropertyCard } from './_bank_mortgage_property_card'
import { BankPaidPropertyCard } from './_bank_paid_property_card'
import type { ActiveLoan, PaidProperty } from './index'

function getInventoryItemForSlot(slot: PropertySlot, inventoryItems: InventoryItemDto[]) {
  if (slot.isLocked) return undefined

  const sorted = [...inventoryItems].sort(
    (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime(),
  )

  return sorted[slot.id - 1]
}

function resolvePaidPropertyForSlot(
  slot: PropertySlot,
  inventoryItems: InventoryItemDto[],
  paidProperties: PaidProperty[],
) {
  const inventoryItem = getInventoryItemForSlot(slot, inventoryItems)
  if (!inventoryItem) return null

  return paidProperties.find((property) => property.id === inventoryItem.id) ?? null
}

function resolveLoanForSlot(
  slot: PropertySlot,
  inventoryItems: InventoryItemDto[],
  loans: ActiveLoan[],
) {
  const inventoryItem = getInventoryItemForSlot(slot, inventoryItems)
  if (!inventoryItem) return null

  return loans.find((loan) => loan.id === inventoryItem.id) ?? null
}

export function BankPropertySlotsGrid({
  slots,
  inventoryItems,
  paidProperties,
  loans,
}: {
  slots: PropertySlot[]
  inventoryItems: InventoryItemDto[]
  paidProperties: PaidProperty[]
  loans: ActiveLoan[]
}) {
  return (
    <div className="bank-paid-grid">
      {slots.map((slot) => {
        if (slot.isLocked) {
          return <BankLockedPropertySlot key={slot.id} />
        }

        const paidProperty = resolvePaidPropertyForSlot(slot, inventoryItems, paidProperties)
        if (paidProperty) {
          return <BankPaidPropertyCard key={slot.id} property={paidProperty} />
        }

        const loan = resolveLoanForSlot(slot, inventoryItems, loans)
        if (loan) {
          return <BankMortgagePropertyCard key={slot.id} loan={loan} />
        }

        if (!slot.item) {
          return <BankEmptyPropertySlot key={slot.id} />
        }

        return <BankEmptyPropertySlot key={slot.id} />
      })}
    </div>
  )
}
