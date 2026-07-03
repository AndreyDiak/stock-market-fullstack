import type { GeneratedNewsKind } from './types.js';

export type NewsCycleCategory = 'stock' | 'deal' | 'realty';

export const NEWS_CYCLE_ORDER: NewsCycleCategory[] = ['stock', 'deal', 'realty'];

export type TurnContentType = 'stock' | 'otc' | 'property';

const CATEGORY_TO_CONTENT: Record<NewsCycleCategory, TurnContentType> = {
  stock: 'stock',
  deal: 'otc',
  realty: 'property',
};

export function kindToNewsCategory(kind: GeneratedNewsKind): NewsCycleCategory {
  switch (kind) {
    case 'OTC_DEAL':
      return 'deal';
    case 'PROPERTY_OFFER':
    case 'PROPERTY_DEAL':
    case 'PROPERTY_INSTALLMENT':
      return 'realty';
    case 'STOCK_TRADE':
      return 'stock';
    case 'WELCOME':
    case 'MARKET':
    case 'INSIDER':
    case 'RUMOR':
    default:
      return 'stock';
  }
}

export function getNextCycleCategory(lastCategory: NewsCycleCategory | null): NewsCycleCategory {
  if (!lastCategory) return NEWS_CYCLE_ORDER[0]!;
  const index = NEWS_CYCLE_ORDER.indexOf(lastCategory);
  return NEWS_CYCLE_ORDER[(index + 1) % NEWS_CYCLE_ORDER.length]!;
}

export function pickNextContentType(lastNewsKind: GeneratedNewsKind | null): TurnContentType {
  const lastCategory = lastNewsKind ? kindToNewsCategory(lastNewsKind) : null;
  const nextCategory = getNextCycleCategory(lastCategory);
  return CATEGORY_TO_CONTENT[nextCategory];
}
