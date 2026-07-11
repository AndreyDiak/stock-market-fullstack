import type { PropertyOperationDetails } from './_bank_operation_history'
import { resolveCatalogMarketPrice } from './_bank_operation_price_diff'

export interface PropertyFinanceSummary {
  marketPrice: number | null
  dealPrice: number
  marketDelta: number | null
  downPayment: number | null
  dealTurn: number
  lastPaymentTurn: number | null
  showLastPayment: boolean
  totalPaid: number
  finalComparisonTotal: number
  finalDelta: number | null
  creditRatePercent: number | null
}

function resolveCreditRatePercent(
  dealPrice: number,
  overpayment: number | null | undefined,
  wasInstallment: boolean,
): number | null {
  if (!wasInstallment || dealPrice <= 0) return null
  return Math.round(((overpayment ?? 0) / dealPrice) * 100)
}

export function buildPropertyFinanceSummary({
  itemRef,
  dealPrice,
  totalPaid,
  finalComparisonTotal,
  purchaseTurn,
  details,
  wasInstallment = false,
}: {
  itemRef: string
  dealPrice: number
  totalPaid: number
  finalComparisonTotal?: number
  purchaseTurn: number
  details: PropertyOperationDetails | null
  wasInstallment?: boolean
}): PropertyFinanceSummary {
  const marketPrice = resolveCatalogMarketPrice(itemRef)
  const hasMarket = marketPrice > 0
  const comparisonTotal = finalComparisonTotal ?? totalPaid
  const overpayment = details?.overpayment ?? null

  return {
    marketPrice: hasMarket ? marketPrice : null,
    dealPrice,
    marketDelta: hasMarket ? dealPrice - marketPrice : null,
    downPayment: details?.firstPayment ?? null,
    dealTurn: details?.purchaseTurn ?? purchaseTurn,
    lastPaymentTurn: details?.finalPaymentTurn ?? null,
    showLastPayment: wasInstallment && details?.finalPaymentTurn != null,
    totalPaid,
    finalComparisonTotal: comparisonTotal,
    finalDelta: hasMarket ? comparisonTotal - marketPrice : null,
    creditRatePercent: resolveCreditRatePercent(dealPrice, overpayment, wasInstallment),
  }
}

export function formatMarketDeltaLabel(delta: number) {
  if (delta < 0) return 'Дисконт к рынку'
  if (delta > 0) return 'Выше рынка'
  return 'Рыночная цена'
}

export function formatFinalDeltaLabel(delta: number) {
  if (delta < 0) return 'Итоговая выгода'
  if (delta > 0) return 'Итоговая переплата'
  return 'Итог'
}
