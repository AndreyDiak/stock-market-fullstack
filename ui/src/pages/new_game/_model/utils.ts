import type { CharacterItem, CharacterRosterItem } from '../../../stores/characters.store'
import { PROFESSION_IMAGES } from '../../../constants/professionImages'

export const LOCKED_PLACEHOLDERS = [
  { name: '???', professionLabel: 'Скоро' },
  { name: '???', professionLabel: 'Скоро' },
  { name: '???', professionLabel: 'Скоро' },
] as const

export const characterGridVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.08,
    },
  },
}

export function calcActiveInstallmentTotal(items: CharacterItem[]): number {
  return items
    .filter((item) => item.installmentsPaid < item.installmentsTotal)
    .reduce((sum, item) => sum + item.monthlyPayment, 0)
}

export function calcNetMonthlyIncome(character: CharacterRosterItem): number {
  return character.salary - calcActiveInstallmentTotal(character.items)
}

export function getCharacterImage(character: CharacterRosterItem): string {
  return PROFESSION_IMAGES[character.profession]
}
