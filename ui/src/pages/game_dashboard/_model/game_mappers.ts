import type { Character, Game } from '../../../api/types'
import { REAL_ESTATE_CATALOG } from '../../../constants/realEstate'
import type { CharacterProfile } from '../_components/character'
import type { PropertyItem, PropertySlot } from '../_components/property'
import { createEmptyPropertySlots } from '../_components/property'

export interface InventoryItemDto {
  id: string
  itemRef: string
  name: string
  purchasePrice: number
  special: string | null
  monthlyPayment: number | null
  installmentsTotal: number | null
  installmentsPaid: number
  isInstallment: boolean
  isPaidOff: boolean
  purchasedAt: string
}

type GameCharacter = NonNullable<Game['character']> & {
  inventoryItems?: InventoryItemDto[]
}

function parsePassiveIncome(special: string | null | undefined) {
  if (!special) return 0
  const match = special.match(/(\d+)\/ход/)
  return match ? Number(match[1]) : 0
}

function mapPropertyItem(item: InventoryItemDto): PropertyItem {
  const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === item.itemRef)
  const special = item.special ?? catalog?.special
  const installmentsTotal = item.installmentsTotal ?? catalog?.installmentMonths ?? 0
  const paybackPct =
    installmentsTotal > 0
      ? Math.round((item.installmentsPaid / installmentsTotal) * 100)
      : 0
  const isOwned =
    item.isPaidOff ||
    !item.isInstallment ||
    (installmentsTotal > 0 && item.installmentsPaid >= installmentsTotal)

  return {
    itemRef: item.itemRef,
    name: item.name,
    income: parsePassiveIncome(special),
    paybackPct,
    isOwned,
    monthlyPayment: item.monthlyPayment ?? catalog?.monthlyPayment,
  }
}

export function countUnlockedPropertySlots(slotUpgradeLevel = 1) {
  return Math.min(4, Math.max(1, slotUpgradeLevel))
}

export function mapInventoryToPropertySlots(
  items: InventoryItemDto[],
  unlockedSlotCount = 1,
): PropertySlot[] {
  const sorted = [...items].sort(
    (a, b) => new Date(a.purchasedAt).getTime() - new Date(b.purchasedAt).getTime(),
  )

  return createEmptyPropertySlots().map((slot, index) => {
    const isLocked = index >= unlockedSlotCount
    const item = !isLocked && sorted[index] ? mapPropertyItem(sorted[index]) : undefined

    return { id: slot.id, isLocked, item }
  })
}

export function mapCharacterToProfile(character: GameCharacter): CharacterProfile {
  return {
    name: character.name,
    profession: character.profession,
    professionLevel: character.professionLevel,
    salary: character.salary,
    reputation: character.reputation,
    tradingLevel: character.tradingLevel,
    dreams: character.dreamItemRefs.map((itemRef) => {
      const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === itemRef)
      return {
        itemRef,
        name: catalog?.name ?? itemRef,
        basePrice: catalog?.basePrice ?? 0,
        savedAmount: 0,
      }
    }),
  }
}

export function getGameInventoryItems(character: Character | null | undefined): InventoryItemDto[] {
  if (!character) return []
  return (character as GameCharacter).inventoryItems ?? []
}

export function mapCharacterSnapshot(
  character: NonNullable<Game['character']>,
  unlockedSlotCount = 1,
) {
  return {
    profile: mapCharacterToProfile(character),
    propertySlots: mapInventoryToPropertySlots(
      getGameInventoryItems(character),
      unlockedSlotCount,
    ),
    inventoryItems: getGameInventoryItems(character),
    balance: character.balance,
  }
}
