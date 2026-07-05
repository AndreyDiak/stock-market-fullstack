import type { InventoryItemDto } from '../../_model/game_mappers'
import type { news_item } from '../../_model/types'
import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate'
import { format_turn_step_label, resolve_published_step } from '../../_model/utils'
import { enrichPropertyOperationDetails } from './_bank_operation_details'
import {
  buildBuyMarketPriceDiff,
  enrichPropertyOperationPriceDiff,
  resolveBuyPriceDiffFromProfitAmount,
  resolveCatalogMarketPrice,
  resolveSellPriceDiffFromSaleFinance,
  type PropertyOperationPriceDiff,
  type PropertyOperationType,
} from './_bank_operation_price_diff'

export type { PropertyOperationPriceDiff, PropertyOperationType }

export interface PropertyOperationDetails {
  firstPayment: number
  overpayment: number
  purchaseTurn: number | null
  finalPaymentTurn: number | null
}

export interface PropertyOperation {
  id: string
  type: PropertyOperationType
  itemRef: string
  itemName: string
  price: number
  paymentLabel: string | null
  sortAt: number
  timeLabel: string
  turnStep: number
  priceDiff: PropertyOperationPriceDiff | null
  details: PropertyOperationDetails | null
}

interface PropertyDealPayload {
  assetId?: string
  itemName?: string
  action?: 'purchased' | 'sold'
  price?: number
  profitAmount?: number
  saleFinance?: {
    purchasePrice?: number
    priceDelta?: number
  } | null
}

function parsePassiveIncome(special: string | null | undefined) {
  if (!special) return 0
  const match = special.match(/(\d+)\/ход/)
  return match ? Number(match[1]) : 0
}

function buildInventoryPurchaseKey(itemRef: string, purchasePrice: number) {
  return `${itemRef}:${purchasePrice}`
}

export function formatPropertyPaymentLabel(isInstallment: boolean) {
  return isInstallment ? 'В кредит' : 'Сразу'
}

export function buildPropertyPurchaseStepLookup(news: news_item[]) {
  const lookup = new Map<string, number>()

  for (const item of news) {
    if (item.kind !== 'PROPERTY_DEAL') continue

    const payload = item.payload as PropertyDealPayload | undefined
    if (payload?.action !== 'purchased' || !payload.assetId || payload.price == null) continue

    const step = resolve_published_step(item)
    if (step == null) continue

    lookup.set(buildInventoryPurchaseKey(payload.assetId, payload.price), step)
  }

  return lookup
}

export function resolvePropertyPurchaseStep(
  itemRef: string,
  purchasePrice: number,
  lookup: Map<string, number>,
  fallback = 1,
) {
  return lookup.get(buildInventoryPurchaseKey(itemRef, purchasePrice)) ?? fallback
}

function resolvePurchasePaymentLabel(
  inventory: InventoryItemDto[],
  assetId: string,
  price: number,
): string | null {
  const match = inventory.find(
    (item) => item.itemRef === assetId && item.purchasePrice === price,
  )
  if (!match) return null
  return formatPropertyPaymentLabel(match.isInstallment)
}

function resolveOperationPriceDiff(
  type: PropertyOperationType,
  payload: PropertyDealPayload,
): PropertyOperationPriceDiff | null {
  if (payload.price == null) return null

  if (type === 'buy') {
    return resolveBuyPriceDiffFromProfitAmount(payload.price, payload.profitAmount)
  }

  return resolveSellPriceDiffFromSaleFinance(payload.price, payload.saleFinance)
}

function buildPropertyOperationHistoryBase(
  news: news_item[],
  inventory: InventoryItemDto[],
  currentStep: number,
): PropertyOperation[] {
  const purchaseStepLookup = buildPropertyPurchaseStepLookup(news)
  const coveredPurchases = new Set<string>()
  const operations: PropertyOperation[] = []

  for (const item of news) {
    if (item.kind !== 'PROPERTY_DEAL') continue

    const payload = item.payload as PropertyDealPayload | undefined
    if (!payload?.assetId || !payload.itemName || payload.price == null || !payload.action) {
      continue
    }

    const type: PropertyOperationType = payload.action === 'purchased' ? 'buy' : 'sell'
    const paymentLabel =
      type === 'buy'
        ? resolvePurchasePaymentLabel(inventory, payload.assetId, payload.price)
        : null

    if (type === 'buy') {
      coveredPurchases.add(buildInventoryPurchaseKey(payload.assetId, payload.price))
    }

    const step = resolve_published_step(item) ?? currentStep

    operations.push({
      id: item.id,
      type,
      itemRef: payload.assetId,
      itemName: payload.itemName,
      price: payload.price,
      paymentLabel,
      sortAt: new Date(item.publishedAt).getTime(),
      timeLabel: format_turn_step_label(step),
      turnStep: step,
      priceDiff: resolveOperationPriceDiff(type, payload),
      details: null,
    })
  }

  for (const item of inventory) {
    const key = buildInventoryPurchaseKey(item.itemRef, item.purchasePrice)
    if (coveredPurchases.has(key)) continue

    coveredPurchases.add(key)
    const step = resolvePropertyPurchaseStep(item.itemRef, item.purchasePrice, purchaseStepLookup)
    const marketPrice = resolveCatalogMarketPrice(item.itemRef)

    operations.push({
      id: `inventory-${item.id}`,
      type: 'buy',
      itemRef: item.itemRef,
      itemName: item.name,
      price: item.purchasePrice,
      paymentLabel: formatPropertyPaymentLabel(item.isInstallment),
      sortAt: new Date(item.purchasedAt).getTime(),
      timeLabel: format_turn_step_label(step),
      turnStep: step,
      priceDiff: buildBuyMarketPriceDiff(item.purchasePrice, marketPrice),
      details: null,
    })
  }

  return operations.sort((a, b) => b.sortAt - a.sortAt)
}

export function buildPropertyOperationHistory(
  news: news_item[],
  inventory: InventoryItemDto[],
  currentStep: number,
  bankBaseRatePercent: number,
): PropertyOperation[] {
  const operations = buildPropertyOperationHistoryBase(news, inventory, currentStep)
  const withPriceDiff = enrichPropertyOperationPriceDiff(operations)
  return enrichPropertyOperationDetails(withPriceDiff, inventory, news, bankBaseRatePercent)
}

export function parseCatalogPassiveIncome(itemRef: string) {
  const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === itemRef)
  return parsePassiveIncome(catalog?.special)
}

export function formatPropertyPurchaseTurnLabel(
  itemRef: string,
  purchasePrice: number,
  news: news_item[],
) {
  const lookup = buildPropertyPurchaseStepLookup(news)
  return format_turn_step_label(resolvePropertyPurchaseStep(itemRef, purchasePrice, lookup))
}
