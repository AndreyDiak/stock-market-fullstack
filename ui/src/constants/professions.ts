import type { CreateGameBody } from '../api/types'

export const PROFESSION_LABELS: Record<CreateGameBody['profession'], string> = {
  STREET_CLEANER: 'Уборщик',
  FARMER: 'Фермер',
  ENGINEER: 'Инженер',
  DEVELOPER: 'Разработчик',
  FINANCIER: 'Финансист',
  DOCTOR: 'Врач',
}
