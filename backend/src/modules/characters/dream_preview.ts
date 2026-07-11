import type { Profession } from '@prisma/client';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import type { DreamDefinition, DreamStageRequirement } from '../../assets/dreams.js';

export type DreamRequirementPreviewKind =
  | 'balance'
  | 'profession'
  | 'portfolio'
  | 'banking'
  | 'trading'
  | 'passive'
  | 'reputation'
  | 'property'
  | 'no_installments';

export interface DreamRequirementPreview {
  kind: DreamRequirementPreviewKind;
  label: string;
}

export interface CharacterDreamPreviewStage {
  order: number;
  title: string;
  description: string;
  requirementsPreview: DreamRequirementPreview[];
  isFinal?: boolean;
}

export interface CharacterDreamPreview {
  title: string;
  description: string;
  stageCount: number;
  pathHint: string;
  stages: CharacterDreamPreviewStage[];
}

const STAGE_TITLES: Partial<Record<Profession, string[]>> = {
  STREET_CLEANER: ['Первые накопления', 'Первый коммерческий объект', 'Деловая репутация', 'Свой бизнес'],
  FARMER: ['Подушка безопасности', 'Первая техника', 'Хозяйство растёт', 'Большое хозяйство'],
  ENGINEER: ['Первый взнос', 'База для будущего дома', 'Жилищный апгрейд', 'Гараж и автомобиль', 'Дом мечты'],
  DEVELOPER: ['Первые инвестиции', 'Трейдинг', 'Инфраструктура капитала', 'Масштабирование', 'Свобода инвестора'],
  FINANCIER: ['Крупный старт', 'Первые активы', 'Портфель и коммерция', 'Премиальный уровень', 'Вершина капитала'],
  DOCTOR: ['Накопления', 'Семейная база', 'Надёжные активы', 'Жильё и репутация', 'Семейный капитал'],
};

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
};

function formatMoney(value: number): string {
  return value.toLocaleString('ru-RU');
}

function itemLabel(itemRef: string): string {
  return REAL_ESTATE.find((r) => r.id === itemRef)?.name ?? ITEM_LABELS[itemRef] ?? itemRef;
}

function buildRequirementsPreview(req: DreamStageRequirement): DreamRequirementPreview[] {
  const items: DreamRequirementPreview[] = [];

  if (req.minBalance != null) {
    items.push({ kind: 'balance', label: `Баланс ${formatMoney(req.minBalance)}` });
  }
  if (req.minProfessionLevel != null) {
    items.push({ kind: 'profession', label: `Профессия ${req.minProfessionLevel}` });
  }
  if (req.minPortfolioValue != null) {
    items.push({ kind: 'portfolio', label: `Портфель ${formatMoney(req.minPortfolioValue)}` });
  }
  if (req.minBankingLevel != null) {
    items.push({ kind: 'banking', label: `Банк ${req.minBankingLevel}` });
  }
  if (req.minTradingLevel != null) {
    items.push({ kind: 'trading', label: `Трейдинг ${req.minTradingLevel}` });
  }
  if (req.minPassiveIncome != null) {
    items.push({ kind: 'passive', label: `Пассив ${formatMoney(req.minPassiveIncome)}/ход` });
  }
  if (req.minReputation != null) {
    items.push({ kind: 'reputation', label: `Репутация ${req.minReputation}` });
  }

  const propertyRefs = [
    ...new Set([...(req.requiredItems ?? []), ...(req.requireItemFullyOwned ?? [])]),
  ];
  for (const itemRef of propertyRefs) {
    items.push({
      kind: 'property',
      label: ITEM_LABELS[itemRef] ?? itemLabel(itemRef),
    });
  }

  if (req.noActiveInstallments) {
    items.push({ kind: 'no_installments', label: 'Без рассрочек' });
  }

  return items;
}

function buildPathHint(stages: DreamStageRequirement[]): string {
  const hints: string[] = [];
  const hasBalance = stages.some((s) => s.minBalance != null);
  const hasProperty = stages.some((s) => (s.requiredItems?.length ?? 0) > 0);
  const hasPortfolio = stages.some((s) => s.minPortfolioValue != null);
  const hasPassive = stages.some((s) => s.minPassiveIncome != null);

  if (hasBalance) hints.push('накопления');
  if (hasProperty) hints.push('активы');
  if (hasPortfolio) hints.push('биржа');
  if (hasPassive) hints.push('пассив');
  hints.push('финал');

  const unique = [...new Set(hints)];
  return `${unique.length} шагов: ${unique.join(' → ')}`;
}

export function buildCharacterDreamPreview(
  profession: Profession,
  dream: DreamDefinition,
): CharacterDreamPreview {
  const titles = STAGE_TITLES[profession] ?? [];

  return {
    title: dream.title,
    description: dream.description,
    stageCount: dream.stages.length,
    pathHint: buildPathHint(dream.stages),
    stages: dream.stages.map((stage, index) => ({
      order: index + 1,
      title: titles[index] ?? `Этап ${index + 1}`,
      description: stage.description,
      requirementsPreview: buildRequirementsPreview(stage),
      isFinal: index === dream.stages.length - 1,
    })),
  };
}
