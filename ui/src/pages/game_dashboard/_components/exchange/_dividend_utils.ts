export const DIVIDEND_CYCLE_TURNS = 10;

export function calcFullDividendPayout(
  dividendPerShare: number | null | undefined,
  quantity: number,
): number | null {
  if (dividendPerShare == null || quantity <= 0) return null;
  return Number((dividendPerShare * quantity).toFixed(2));
}

export function calcProportionalDividendPayout(
  fullPayout: number,
  turnsHeldInCycle: number,
): number {
  const held = Math.max(0, Math.min(turnsHeldInCycle, DIVIDEND_CYCLE_TURNS));
  return Number((fullPayout * (held / DIVIDEND_CYCLE_TURNS)).toFixed(2));
}
