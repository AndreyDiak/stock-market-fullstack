import type { CreateGameBody } from '../api/types'

export const PROFESSION_LABELS: Record<CreateGameBody['profession'], string> = {
  STREET_CLEANER: 'Уборщик',
  FARMER: 'Фермер',
  ENGINEER: 'Инженер',
  DEVELOPER: 'Разработчик',
  FINANCIER: 'Финансист',
  DOCTOR: 'Врач',
}

export const PROFESSION_INSIDER_SECTOR: Partial<Record<CreateGameBody['profession'], string>> = {
  DOCTOR: 'HEALTHCARE',
  DEVELOPER: 'TECHNOLOGY',
  ENGINEER: 'ENERGY',
  FINANCIER: 'FINANCE',
  FARMER: 'AGRICULTURE',
}
