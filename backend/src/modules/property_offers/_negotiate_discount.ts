/** Максимальная скидка на шкале слайдера торга по имуществу. */
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

export function getMaxNegotiateDiscountPercent(tradingLevel: number): number {
  const safeLevel = Number.isFinite(tradingLevel) ? tradingLevel : 1;
  const level = Math.max(1, Math.min(safeLevel, 6)) as keyof typeof MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL;
  return MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL[level];
}

export function isValidPurchaseDiscountPercent(discountPercent: number): boolean {
  if (!Number.isFinite(discountPercent)) return false;
  const rounded = Math.round(discountPercent);
  return (
    rounded >= NEGOTIATE_PURCHASE_DISCOUNT_MIN &&
    rounded <= NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT &&
    rounded % NEGOTIATE_PURCHASE_DISCOUNT_STEP === 0
  );
}

export function snapPurchaseDiscountPercent(
  discountPercent: number,
  maxAllowed: number = NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT,
): number {
  const safePercent = Number.isFinite(discountPercent) ? discountPercent : NEGOTIATE_PURCHASE_DISCOUNT_MIN;
  const safeMax = Number.isFinite(maxAllowed) ? maxAllowed : NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT;
  const cap = Math.max(
    NEGOTIATE_PURCHASE_DISCOUNT_MIN,
    Math.min(safeMax, NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT),
  );
  const snapped =
    Math.round(safePercent / NEGOTIATE_PURCHASE_DISCOUNT_STEP) *
    NEGOTIATE_PURCHASE_DISCOUNT_STEP;
  return Math.max(NEGOTIATE_PURCHASE_DISCOUNT_MIN, Math.min(cap, snapped));
}

export function normalizeNegotiatePercent(
  adjustmentPercent: number,
  tradingLevel: number,
): number {
  return snapPurchaseDiscountPercent(
    adjustmentPercent,
    getMaxNegotiateDiscountPercent(tradingLevel),
  );
}

/** Требуемое значение на d20 без учёта репутации: 5%→11 … 50%→20. */
export function calcPurchaseDiscountDiceRequirement(discountPercent: number): number {
  const snapped = snapPurchaseDiscountPercent(discountPercent);
  return 10 + snapped / NEGOTIATE_PURCHASE_DISCOUNT_STEP;
}
