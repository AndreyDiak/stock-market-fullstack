import type { PropertyOffer } from '../../_model/types';

export const NEGOTIATE_MIN_ADJUSTMENT = -15;
export const NEGOTIATE_MAX_ADJUSTMENT = 50;
export const NEGOTIATE_MIN_TARGET = 5;
export const NEGOTIATE_MAX_TARGET = 19;

/** Максимум на шкале слайдера торга. */
export const NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT = 50;

/** Минимальная и шаг скидки при покупке через торг. */
export const NEGOTIATE_PURCHASE_DISCOUNT_MIN = 5;
export const NEGOTIATE_PURCHASE_DISCOUNT_STEP = 5;

export const MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL = {
  1: 15,
  2: 25,
  3: 30,
  4: 35,
  5: 42,
  6: 50,
} as const;

/** Название навыка, влияющего на лимит скидки при торге. */
export const TRADING_SKILL_NAME = 'Курс трейдинга';

export const SUCCESS_CHANCE_LABEL_THRESHOLDS = [
  { min: 85, label: 'Почти наверняка' },
  { min: 65, label: 'Хорошие шансы' },
  { min: 40, label: 'Рискованно' },
  { min: 20, label: 'Низкие шансы' },
  { min: 0, label: 'Крайне рискованно' },
] as const;

export function getMaxNegotiateDiscountPercent(tradingLevel: number): number {
  const safeLevel = Number.isFinite(tradingLevel) ? tradingLevel : 1;
  const level = Math.max(1, Math.min(safeLevel, 6)) as keyof typeof MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL;
  return MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL[level];
}

export function snapPurchaseDiscountPercent(
  discountPercent: number,
  maxAllowed: number = NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT,
): number {
  const cap = Math.max(
    NEGOTIATE_PURCHASE_DISCOUNT_MIN,
    Math.min(maxAllowed, NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT),
  );
  const snapped =
    Math.round(discountPercent / NEGOTIATE_PURCHASE_DISCOUNT_STEP) *
    NEGOTIATE_PURCHASE_DISCOUNT_STEP;
  return Math.max(NEGOTIATE_PURCHASE_DISCOUNT_MIN, Math.min(cap, snapped));
}

/** Требуемое значение на d20 без учёта репутации: 5%→11 … 50%→20. */
export function calcPurchaseDiscountDiceRequirement(discountPercent: number): number {
  const snapped = snapPurchaseDiscountPercent(discountPercent);
  return 10 + snapped / NEGOTIATE_PURCHASE_DISCOUNT_STEP;
}

export function clampNegotiateAdjustment(value: number): number {
  return Math.max(NEGOTIATE_MIN_ADJUSTMENT, Math.min(NEGOTIATE_MAX_ADJUSTMENT, value));
}

export function calcNegotiateTarget(adjustmentPercent: number): number {
  const clamped = clampNegotiateAdjustment(adjustmentPercent);
  const span = NEGOTIATE_MAX_ADJUSTMENT - NEGOTIATE_MIN_ADJUSTMENT;
  const ratio = (clamped - NEGOTIATE_MIN_ADJUSTMENT) / span;
  return Math.round(NEGOTIATE_MIN_TARGET + ratio * (NEGOTIATE_MAX_TARGET - NEGOTIATE_MIN_TARGET));
}

export function calcPurchaseNegotiateTarget(discountPercent: number): number {
  return calcPurchaseDiscountDiceRequirement(discountPercent);
}

function calcSuccessChanceFromTarget(target: number, reputation: number): number {
  const repBonus = Math.floor(reputation);
  const minD20 = target - repBonus;

  if (minD20 <= 1) return 100;
  if (minD20 > 20) return 0;
  return Math.round(((21 - minD20) / 20) * 100);
}

export function calcNegotiateSuccessChance(adjustmentPercent: number, reputation: number): number {
  return calcSuccessChanceFromTarget(calcNegotiateTarget(adjustmentPercent), reputation);
}

export function calcPurchaseNegotiateSuccessChance(
  discountPercent: number,
  reputation: number,
): number {
  return calcSuccessChanceFromTarget(
    calcPurchaseNegotiateTarget(discountPercent),
    reputation,
  );
}

export function calcProposedPrice(
  type: PropertyOffer['type'],
  offerPrice: number,
  adjustmentPercent: number,
): number {
  const clamped = clampNegotiateAdjustment(adjustmentPercent);
  if (type === 'BUY') {
    return Math.round(offerPrice * (1 + clamped / 100));
  }
  return Math.round(offerPrice * (1 - clamped / 100));
}

export function isPurchaseNegotiation(type: PropertyOffer['type']): boolean {
  return type === 'SELL';
}

export function clampPurchaseDiscountPercent(
  discountPercent: number,
  maxAllowed: number = NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT,
): number {
  return snapPurchaseDiscountPercent(discountPercent, maxAllowed);
}

/** Скидка в UI (5…50, шаг 5) → adjustment для API. */
export function discountPercentToAdjustment(discountPercent: number, maxAllowed?: number): number {
  return clampPurchaseDiscountPercent(discountPercent, maxAllowed);
}

export function calcPurchaseProposedPrice(
  askingPrice: number,
  discountPercent: number,
  maxAllowed?: number,
): number {
  const discount = clampPurchaseDiscountPercent(discountPercent, maxAllowed);
  const calculated = Math.round(askingPrice * (1 - discount / 100));
  return Math.min(calculated, askingPrice);
}

export function calcSellMarkupProposedPrice(
  askingPrice: number,
  markupPercent: number,
  maxAllowed?: number,
): number {
  const markup = clampPurchaseDiscountPercent(markupPercent, maxAllowed);
  return Math.round(askingPrice * (1 + markup / 100));
}

export function calcSavings(askingPrice: number, proposedPrice: number): number {
  return Math.max(0, askingPrice - proposedPrice);
}

export function calcMinD20Roll(target: number, reputation: number): number {
  return target - Math.floor(reputation);
}

export function calcRequiredDiceFace(target: number, reputation: number): number {
  const minD20 = calcMinD20Roll(target, reputation);
  if (minD20 <= 1) return 1;
  return Math.min(20, minD20);
}

export function calcActualMinDiceRoll(diceRequirement: number, reputation: number): number {
  const minD20 = diceRequirement - Math.floor(reputation);
  if (minD20 <= 1) return 1;
  return Math.min(20, minD20);
}

export function isNegotiateCheckRequired(successChance: number): boolean {
  return successChance < 100;
}

export function getSuccessChanceLabel(successChance: number): string {
  for (const threshold of SUCCESS_CHANCE_LABEL_THRESHOLDS) {
    if (successChance >= threshold.min) return threshold.label;
  }
  return SUCCESS_CHANCE_LABEL_THRESHOLDS[SUCCESS_CHANCE_LABEL_THRESHOLDS.length - 1].label;
}

export type SuccessChanceTone = 'high' | 'medium' | 'low';

export function getSuccessChanceTone(successChance: number): SuccessChanceTone {
  if (successChance >= 65) return 'high';
  if (successChance >= 40) return 'medium';
  return 'low';
}

export function formatAdjustmentLabel(adjustmentPercent: number): string {
  const rounded = Math.round(adjustmentPercent);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

export function formatPositiveDiscountLabel(discountPercent: number): string {
  return `${Math.round(discountPercent)}%`;
}

export function sliderPercentFromDiscountPercent(discountPercent: number): number {
  const span =
    NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT - NEGOTIATE_PURCHASE_DISCOUNT_MIN;
  const normalized = discountPercent - NEGOTIATE_PURCHASE_DISCOUNT_MIN;
  return (normalized / span) * 100;
}

export function sliderLockedPercentFromMaxAllowed(maxAllowed: number): number {
  return sliderPercentFromDiscountPercent(
    clampPurchaseDiscountPercent(maxAllowed, maxAllowed),
  );
}
