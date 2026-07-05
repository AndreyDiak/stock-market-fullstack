import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate'
import { formatMarketComparisonPercent } from '../real_estate/_offer_styles'

export interface PropertyOperationPriceDiff {
  amount: number
  referencePrice: number
  percent: number | null
}

export type PropertyOperationType = 'buy' | 'sell'

type OperationWithPriceDiff = {
  type: PropertyOperationType
  itemRef: string
  price: number
  turnStep: number
  priceDiff: PropertyOperationPriceDiff | null
}
export type PropertyOperationPriceDiffTone = 'profit' | 'loss' | 'neutral'

export interface PropertyOperationPriceDiffView {
  label: string
  detailLabel: string
  tone: PropertyOperationPriceDiffTone
}

interface PropertySaleNewsFinance {
  purchasePrice?: number
  priceDelta?: number
}

function formatSaleVsPurchasePercent(salePrice: number, purchasePrice: number) {
  const diff = salePrice - purchasePrice
  if (diff === 0 || purchasePrice <= 0) return '0%'

  const percent = ((Math.abs(diff) / purchasePrice) * 100).toFixed(1).replace('.', ',')
  return diff > 0 ? `+${percent}%` : `−${percent}%`
}

function buildPriceDiff(price: number, referencePrice: number): PropertyOperationPriceDiff | null {
  if (referencePrice <= 0) return null

  const amount = price - referencePrice
  const percent = (amount / referencePrice) * 100

  return {
    amount,
    referencePrice,
    percent: Number.isFinite(percent) ? percent : null,
  }
}

export function buildBuyMarketPriceDiff(
  price: number,
  marketPrice: number,
): PropertyOperationPriceDiff | null {
  return buildPriceDiff(price, marketPrice)
}

export function buildSellPurchasePriceDiff(
  salePrice: number,
  purchasePrice: number,
): PropertyOperationPriceDiff | null {
  return buildPriceDiff(salePrice, purchasePrice)
}

export function resolveCatalogMarketPrice(itemRef: string) {
  return REAL_ESTATE_CATALOG.find((entry) => entry.id === itemRef)?.basePrice ?? 0
}

function resolvePriceDiffTone(
  type: PropertyOperationType,
  amount: number,
): PropertyOperationPriceDiffTone {
  if (amount === 0) return 'neutral'
  if (type === 'buy') return amount < 0 ? 'profit' : 'loss'
  return amount > 0 ? 'profit' : 'loss'
}

export function formatOperationPriceDiff(
  operation: OperationWithPriceDiff,
): PropertyOperationPriceDiffView | null {  const { priceDiff, type, price } = operation
  if (!priceDiff) return null

  const tone = resolvePriceDiffTone(type, priceDiff.amount)

  if (type === 'buy') {
    if (priceDiff.amount === 0) {
      return {
        label: 'Рыночная стоимость',
        detailLabel: 'Рыночная стоимость',
        tone,
      }
    }

    const percentLabel = formatMarketComparisonPercent(price, priceDiff.referencePrice)
    return {
      label: `${percentLabel} от рынка`,
      detailLabel: 'От рыночной цены',
      tone,
    }
  }

  return {
    label: `${formatSaleVsPurchasePercent(price, priceDiff.referencePrice)} от покупки`,
    detailLabel: 'От цены покупки',
    tone,
  }
}

export function enrichPropertyOperationPriceDiff<T extends OperationWithPriceDiff>(
  operations: T[],
): T[] {  const buys = operations
    .filter((operation) => operation.type === 'buy')
    .sort((a, b) => a.turnStep - b.turnStep)

  return operations.map((operation) => {
    if (operation.priceDiff) return operation

    if (operation.type === 'buy') {
      const marketPrice = resolveCatalogMarketPrice(operation.itemRef)
      return {
        ...operation,
        priceDiff: buildBuyMarketPriceDiff(operation.price, marketPrice),
      }
    }

    const matchedBuy = [...buys]
      .filter(
        (entry) => entry.itemRef === operation.itemRef && entry.turnStep < operation.turnStep,
      )
      .sort((a, b) => b.turnStep - a.turnStep)[0]

    if (!matchedBuy) return operation

    return {
      ...operation,
      priceDiff: buildSellPurchasePriceDiff(operation.price, matchedBuy.price),
    }
  })
}

export function resolveBuyPriceDiffFromProfitAmount(
  price: number,
  profitAmount: number | undefined,
) {
  if (profitAmount == null) return null
  return buildBuyMarketPriceDiff(price, price - profitAmount)
}

export function resolveSellPriceDiffFromSaleFinance(
  price: number,
  saleFinance: PropertySaleNewsFinance | null | undefined,
) {
  if (!saleFinance?.purchasePrice) return null
  if (saleFinance.priceDelta != null) {
    return buildSellPurchasePriceDiff(price, saleFinance.purchasePrice)
  }
  return buildSellPurchasePriceDiff(price, saleFinance.purchasePrice)
}
