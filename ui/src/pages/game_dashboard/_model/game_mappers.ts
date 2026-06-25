import type { Character, Game } from '../../../api/types'
import { REAL_ESTATE_CATALOG } from '../../../constants/realEstate'
import type { CharacterProfile } from '../_components/character_profile_panel'
import type { PropertyItem, PropertySlot } from '../_components/property_inventory_block'

export interface InventoryItemDto {
  id: string
  itemRef: string
  name: string
  special: string | null
  monthlyPayment: number | null
  installmentsTotal: number | null
  installmentsPaid: number
  isInstallment: boolean
  isPaidOff: boolean
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

  return {
    itemRef: item.itemRef,
    name: item.name,
    income: parsePassiveIncome(special),
    paybackPct,
    monthlyPayment: item.monthlyPayment ?? catalog?.monthlyPayment,
  }
}

export function mapInventoryToPropertySlots(items: InventoryItemDto[]): PropertySlot[] {
  const firstItem = items[0]

  return [
    {
      id: 1,
      isLocked: false,
      item: firstItem ? mapPropertyItem(firstItem) : undefined,
    },
    { id: 2, isLocked: true },
    { id: 3, isLocked: true },
    { id: 4, isLocked: true },
  ]
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

export function mapCharacterSnapshot(character: NonNullable<Game['character']>) {
  return {
    profile: mapCharacterToProfile(character),
    propertySlots: mapInventoryToPropertySlots(getGameInventoryItems(character)),
    balance: character.balance,
  }
}
