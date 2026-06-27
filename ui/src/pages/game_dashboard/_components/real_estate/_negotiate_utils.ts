import type { PropertyOffer } from '../../_model/types';

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

export function formatAdjustmentLabel(adjustmentPercent: number): string {
  const rounded = Math.round(adjustmentPercent);
  return rounded > 0 ? `+${rounded}%` : `${rounded}%`;
}

export function getDiceTargetTone(target: number): 'easy' | 'normal' | 'risky' {
  if (target <= 8) return 'easy';
  if (target <= 14) return 'normal';
  return 'risky';
}

export function getDiceColorForTone(tone: 'easy' | 'normal' | 'risky'): number {
  if (tone === 'easy') return 0x10b981;
  if (tone === 'normal') return 0x38bdf8;
  return 0xef4444;
}

export type NegotiateRiskTier = 'low' | 'medium' | 'high';

export function getNegotiateRiskTier(successChance: number): NegotiateRiskTier {
  if (successChance > 75) return 'low';
  if (successChance >= 30) return 'medium';
  return 'high';
}

export function getRiskTierTextClass(tier: NegotiateRiskTier): string {
  if (tier === 'low') return 'text-emerald-400';
  if (tier === 'medium') return 'text-amber-400';
  return 'text-rose-500';
}

export function getDiceColorForSuccessChance(successChance: number): number {
  const tier = getNegotiateRiskTier(successChance);
  if (tier === 'low') return 0x34d399;
  if (tier === 'medium') return 0xfbbf24;
  return 0xf43f5e;
}

export function getRiskTierGlowRgb(tier: NegotiateRiskTier): string {
  if (tier === 'low') return '52, 211, 153';
  if (tier === 'medium') return '251, 191, 36';
  return '244, 63, 94';
}

export function sliderThumbPercent(adjustmentPercent: number): number {
  const clamped = clampNegotiateAdjustment(adjustmentPercent);
  return ((clamped - NEGOTIATE_MIN_ADJUSTMENT) / (NEGOTIATE_MAX_ADJUSTMENT - NEGOTIATE_MIN_ADJUSTMENT)) * 100;
}
