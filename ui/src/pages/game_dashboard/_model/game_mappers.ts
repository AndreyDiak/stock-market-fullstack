import type { Character, Game } from '../../../api/types'
import { REAL_ESTATE_CATALOG } from '../../../constants/realEstate'
import type { CharacterProfile } from '../_components/character'
import type { PropertyItem, PropertySlot } from '../_components/property'
import { createEmptyPropertySlots } from '../_components/property'
import { calcPaidLoanAmount } from '../_components/real_estate/_accept_deal_utils'
import { calcInstallmentTotalOwed } from '../_components/real_estate/_installment_purchase'
import { roundReputation } from './utils'

export interface InventoryItemDto {
  id: string
  itemRef: string
  name: string
  purchasePrice: number
  downPaymentAmount: number | null
  special: string | null
  monthlyPayment: number | null
  installmentsTotal: number | null
  installmentsPaid: number
  installmentPrepay?: number
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

export function calcPaybackPct(item: InventoryItemDto): number {
  if (item.isPaidOff || !item.isInstallment) {
    return 100
  }

  const totalOwed = calcInstallmentTotalOwed(item)
  const paidTotal = calcPaidLoanAmount(item)

  if (paidTotal >= totalOwed) {
    return 100
  }

  if (totalOwed > 0) {
    return Math.min(100, Math.round((paidTotal / totalOwed) * 100))
  }

  const installmentsTotal = item.installmentsTotal ?? 0
  if (installmentsTotal <= 0) return 0

  return Math.round((item.installmentsPaid / installmentsTotal) * 100)
}

function hasActiveInstallmentDebt(item: InventoryItemDto): boolean {
  if (!item.isInstallment || item.isPaidOff) return false

  const installmentsTotal = item.installmentsTotal ?? 0
  if (installmentsTotal > 0 && item.installmentsPaid >= installmentsTotal) {
    return false
  }

  return calcPaidLoanAmount(item) < calcInstallmentTotalOwed(item)
}

function mapPropertyItem(item: InventoryItemDto): PropertyItem {
  const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === item.itemRef)
  const special = catalog?.special ?? item.special
  const monthlyPayment = item.monthlyPayment ?? catalog?.monthlyPayment ?? 0
  const paybackPct = calcPaybackPct(item)
  const isOwned =
    item.isPaidOff ||
    !item.isInstallment ||
    !hasActiveInstallmentDebt(item)

  return {
    itemRef: item.itemRef,
    name: item.name,
    income: parsePassiveIncome(special),
    paybackPct,
    isOwned,
    monthlyPayment: monthlyPayment || catalog?.monthlyPayment,
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
    reputation: roundReputation(character.reputation),
    tradingLevel: character.tradingLevel,
    bankingLevel: character.bankingLevel,
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
