import type { PropertyOfferType } from './_types.js';

export const NEGOTIATE_MIN_ADJUSTMENT = -15;
export const NEGOTIATE_MAX_ADJUSTMENT = 45;
export const NEGOTIATE_MIN_TARGET = 5;
export const NEGOTIATE_MAX_TARGET = 19;

export function clampNegotiateAdjustment(value: number): number {
  return Math.max(NEGOTIATE_MIN_ADJUSTMENT, Math.min(NEGOTIATE_MAX_ADJUSTMENT, value));
}

export function calcNegotiateTarget(adjustmentPercent: number): number {
  const clamped = clampNegotiateAdjustment(adjustmentPercent);
  const span = NEGOTIATE_MAX_ADJUSTMENT - NEGOTIATE_MIN_ADJUSTMENT;
  const ratio = (clamped - NEGOTIATE_MIN_ADJUSTMENT) / span;
  return Math.round(NEGOTIATE_MIN_TARGET + ratio * (NEGOTIATE_MAX_TARGET - NEGOTIATE_MIN_TARGET));
}

export function calcNegotiateSuccessChance(adjustmentPercent: number, reputation: number): number {
  const target = calcNegotiateTarget(adjustmentPercent);
  const repBonus = Math.floor(reputation);
  const minD20 = target - repBonus;

  if (minD20 <= 1) return 100;
  if (minD20 > 20) return 0;
  return Math.round(((21 - minD20) / 20) * 100);
}

export function calcProposedPrice(
  type: PropertyOfferType,
  offerPrice: number,
  adjustmentPercent: number,
): number {
  const clamped = clampNegotiateAdjustment(adjustmentPercent);
  if (type === 'BUY') {
    return Math.round(offerPrice * (1 + clamped / 100));
  }
  return Math.round(offerPrice * (1 - clamped / 100));
}

export function formatAdjustmentLabel(adjustmentPercent: number): string {
  const rounded = Math.round(adjustmentPercent);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}
