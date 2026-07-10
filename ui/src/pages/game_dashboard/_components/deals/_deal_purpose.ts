import type { DealPurpose } from '../../../../api/gameTurn';

export const DEAL_PURPOSE_LABELS: Record<DealPurpose, string> = {
  VALUE_EXCHANGE: 'Обмен',
  LIQUIDITY: 'Быстрые деньги',
  DREAM_HELPER: 'К мечте',
  STOCK_PACKAGE: 'Пакет акций',
};

export const DEAL_PURPOSE_DESCRIPTIONS: Record<DealPurpose, string> = {
  VALUE_EXCHANGE: 'Оцените, выгоден ли обмен.',
  LIQUIDITY: 'Быстрые деньги сейчас в обмен на часть портфеля.',
  DREAM_HELPER: 'Деньги + акции + более дешёвая недвижимость (trade-in) в обмен на предмет мечты.',
  STOCK_PACKAGE: 'Закрытое предложение по акциям.',
};

export function formatDealPurposeLabel(purpose?: DealPurpose): string | null {
  if (!purpose) return null;
  return DEAL_PURPOSE_LABELS[purpose] ?? null;
}

export function formatDealPurposeDescription(purpose?: DealPurpose): string | null {
  if (!purpose) return null;
  return DEAL_PURPOSE_DESCRIPTIONS[purpose] ?? null;
}
