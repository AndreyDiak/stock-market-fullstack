import type { CreateGameBody } from '../api/types'
import { getProfessionAvatar, PROFESSION_AVATARS } from './professionImages'

/** Соответствие имён NPC из backend/src/assets/npcs.ts */
const BOT_NAME_PROFESSION: Record<string, CreateGameBody['profession']> = {
  Иваныч: 'STREET_CLEANER',
  Петрович: 'FARMER',
  Сергей: 'ENGINEER',
  Алекс: 'DEVELOPER',
  Марк: 'FINANCIER',
  Борис: 'DOCTOR',
}

/** Аватар бота: явный src или портрет по профессии / имени */
export function getBotAvatar(
  botName: string,
  profession?: CreateGameBody['profession'],
): string | undefined {
  if (profession) return getProfessionAvatar(profession)
  const mapped = BOT_NAME_PROFESSION[botName]
  if (mapped) return PROFESSION_AVATARS[mapped]
  return undefined
}
