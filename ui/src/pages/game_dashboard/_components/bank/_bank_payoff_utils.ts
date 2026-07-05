export const PAYOFF_PERCENT_MIN = 5
export const PAYOFF_PERCENT_STEP = 5
export const PAYOFF_PERCENT_MAX = 100

export function normalizePayoffPercent(percent: number): number {
  return Math.min(
    PAYOFF_PERCENT_MAX,
    Math.max(PAYOFF_PERCENT_MIN, Math.round(percent / PAYOFF_PERCENT_STEP) * PAYOFF_PERCENT_STEP),
  )
}

export function calcInstallmentEarlyPayAmount(
  remaining: number,
  payPercent: number,
  balance: number,
): number {
  const normalizedPercent = normalizePayoffPercent(payPercent)
  const amount =
    normalizedPercent >= PAYOFF_PERCENT_MAX
      ? remaining
      : Math.round((remaining * normalizedPercent) / 100)
  return Math.min(Math.max(0, amount), balance, remaining)
}

export function calcMaxAffordablePayoffPercent(remaining: number, balance: number): number {
  if (remaining <= 0 || balance <= 0) return 0
  if (balance >= remaining) return PAYOFF_PERCENT_MAX
  const rawPercent = Math.floor((balance / remaining) * 100)
  const stepped = Math.floor(rawPercent / PAYOFF_PERCENT_STEP) * PAYOFF_PERCENT_STEP
  return Math.max(PAYOFF_PERCENT_MIN, stepped)
}

export function calcMinPayoffAmount(remaining: number): number {
  return calcInstallmentEarlyPayAmount(remaining, PAYOFF_PERCENT_MIN, Number.MAX_SAFE_INTEGER)
}
