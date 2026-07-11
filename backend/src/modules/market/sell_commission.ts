export const SELL_COMMISSION_MAX_PERCENT = 10;
export const SELL_COMMISSION_MIN_PERCENT = 5;

export function calcSellCommissionPercent(tradingLevel: number): number {
  const level = Math.max(1, Math.min(tradingLevel, 6));
  return SELL_COMMISSION_MAX_PERCENT - (level - 1);
}

export function calcNetSellProceeds(grossProceeds: number, tradingLevel: number): {
  gross: number;
  commissionPercent: number;
  commissionAmount: number;
  net: number;
} {
  const gross = Number(grossProceeds.toFixed(2));
  const commissionPercent = calcSellCommissionPercent(tradingLevel);
  const commissionAmount = Number((gross * (commissionPercent / 100)).toFixed(2));
  const net = Number((gross - commissionAmount).toFixed(2));

  return { gross, commissionPercent, commissionAmount, net };
}
