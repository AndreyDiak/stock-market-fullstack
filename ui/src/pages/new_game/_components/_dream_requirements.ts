import type {
  CharacterDreamPreviewRequirement,
  DreamStageRequirement,
} from '../../../stores/characters.store'
import { REAL_ESTATE_CATALOG } from '../../../constants/realEstate'

const ITEM_LABELS: Record<string, string> = {
  warehouse: 'Склад',
  apartment: 'Квартира',
  car: 'Автомобиль',
  penthouse: 'Пентхаус',
  sport_car: 'Спорткар',
  country_house: 'Дача',
  garage: 'Гараж',
  tractor: 'Трактор',
  combine_harvester: 'Комбайн',
  yacht: 'Яхта',
  boat: 'Лодка',
  trade_pavilion: 'Торговый павильон',
  car_wash: 'Автомойка',
  trip: 'Кругосветка',
  hiking_ticket: 'Билет в поход',
  collectible_card: 'Коллекционная карточка',
  expensive_painting: 'Картина',
}


function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU')
}

function itemLabel(itemRef: string): string {
  return REAL_ESTATE_CATALOG.find((item) => item.id === itemRef)?.name ?? ITEM_LABELS[itemRef] ?? itemRef
}

export function buildDreamRequirementsPreview(
  req: DreamStageRequirement,
): CharacterDreamPreviewRequirement[] {
  const items: CharacterDreamPreviewRequirement[] = []

  if (req.minBalance != null) {
    items.push({ kind: 'balance', label: `Баланс ${formatMoney(req.minBalance)}` })
  }
  if (req.minProfessionLevel != null) {
    items.push({ kind: 'profession', label: `Профессия ${req.minProfessionLevel}` })
  }
  if (req.minPortfolioValue != null) {
    items.push({ kind: 'portfolio', label: `Портфель ${formatMoney(req.minPortfolioValue)}` })
  }
  if (req.minBankingLevel != null) {
    items.push({ kind: 'banking', label: `Банк ${req.minBankingLevel}` })
  }
  if (req.minTradingLevel != null) {
    items.push({ kind: 'trading', label: `Трейдинг ${req.minTradingLevel}` })
  }
  if (req.minPassiveIncome != null) {
    items.push({ kind: 'passive', label: `Пассив ${formatMoney(req.minPassiveIncome)}/ход` })
  }
  if (req.minReputation != null) {
    items.push({ kind: 'reputation', label: `Репутация ${req.minReputation}` })
  }

  const propertyRefs = [
    ...new Set([...(req.requiredItems ?? []), ...(req.requireItemFullyOwned ?? [])]),
  ]
  for (const itemRef of propertyRefs) {
    items.push({
      kind: 'property',
      label: ITEM_LABELS[itemRef] ?? itemLabel(itemRef),
    })
  }

  if (req.noActiveInstallments) {
    items.push({ kind: 'no_installments', label: 'Без рассрочек' })
  }

  return items
}
