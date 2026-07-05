import type { InventoryItemDto } from '../../_model/game_mappers'
import type { news_item } from '../../_model/types'
import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate'
import { getPurchaseInstallmentPlan } from '../real_estate/_accept_deal_utils'
import {
  calcInstallmentTotalOwed,
  resolveDownPaymentAmount,
} from '../real_estate/_installment_purchase'
import type { PropertyOperation, PropertyOperationDetails } from './_bank_operation_history'
import {
  buildPropertyPurchaseStepLookup,
  formatPropertyPaymentLabel,
  resolvePropertyPurchaseStep,
} from './_bank_operation_history'
import { resolve_published_step } from '../../_model/utils'

interface PropertyDealPayload {
  assetId?: string
  itemName?: string
  action?: 'purchased' | 'sold'
  price?: number
}

interface PropertyInstallmentPayload {
  assetId?: string
  itemName?: string
  paidOff?: boolean
}

const DEFAULT_DOWN_PAYMENT_PERCENT = 15

function buildPayoffTurnAssigner(news: news_item[]) {
  const queues = new Map<string, number[]>()

  for (const item of news) {
    if (item.kind !== 'PROPERTY_INSTALLMENT') continue

    const payload = item.payload as PropertyInstallmentPayload | undefined
    if (!payload?.paidOff || !payload.assetId) continue

    const step = resolve_published_step(item)
    if (step == null) continue

    const list = queues.get(payload.assetId) ?? []
    list.push(step)
    queues.set(payload.assetId, list)
  }

  for (const list of queues.values()) {
    list.sort((a, b) => a - b)
  }

  return (itemRef: string, purchaseTurn: number): number | null => {
    const list = queues.get(itemRef)
    if (!list?.length) return null

    const index = list.findIndex((step) => step >= purchaseTurn)
    if (index === -1) return null

    return list.splice(index, 1)[0] ?? null
  }
}

function findInventoryMatch(
  inventory: InventoryItemDto[],
  itemRef: string,
  purchasePrice: number,
) {
  return inventory.find(
    (item) => item.itemRef === itemRef && item.purchasePrice === purchasePrice,
  )
}

function estimateInstallmentDetails(
  itemRef: string,
  purchasePrice: number,
  bankBaseRatePercent: number,
) {
  const catalog = REAL_ESTATE_CATALOG.find((entry) => entry.id === itemRef)
  const plan = catalog
    ? getPurchaseInstallmentPlan(
        itemRef,
        purchasePrice,
        DEFAULT_DOWN_PAYMENT_PERCENT,
        bankBaseRatePercent,
      )
    : null

  if (!plan) {
    const firstPayment = Math.round((purchasePrice * DEFAULT_DOWN_PAYMENT_PERCENT) / 100)
    return { firstPayment, overpayment: 0 }
  }

  return {
    firstPayment: plan.downPayment,
    overpayment: plan.overpayment,
  }
}

function resolveBuyPaymentDetails(
  itemRef: string,
  purchasePrice: number,
  inventoryItem: InventoryItemDto | undefined,
  isInstallment: boolean,
  bankBaseRatePercent: number,
) {
  if (inventoryItem) {
    if (inventoryItem.isInstallment) {
      return {
        firstPayment: resolveDownPaymentAmount(inventoryItem),
        overpayment: Math.max(0, calcInstallmentTotalOwed(inventoryItem) - inventoryItem.purchasePrice),
      }
    }

    return {
      firstPayment: inventoryItem.purchasePrice,
      overpayment: 0,
    }
  }

  if (isInstallment) {
    return estimateInstallmentDetails(itemRef, purchasePrice, bankBaseRatePercent)
  }

  return {
    firstPayment: purchasePrice,
    overpayment: 0,
  }
}

function findSellTurnAfterPurchase(
  news: news_item[],
  itemRef: string,
  purchaseTurn: number,
): number | null {
  for (const item of news) {
    if (item.kind !== 'PROPERTY_DEAL') continue

    const payload = item.payload as PropertyDealPayload | undefined
    if (payload?.action !== 'sold' || payload.assetId !== itemRef) continue

    const step = resolve_published_step(item)
    if (step == null || step < purchaseTurn) continue

    return step
  }

  return null
}

function resolveFinalPaymentTurn(
  itemRef: string,
  purchaseTurn: number,
  isInstallment: boolean,
  inventoryItem: InventoryItemDto | undefined,
  consumePayoffTurn: (itemRef: string, purchaseTurn: number) => number | null,
  news: news_item[],
) {
  if (!isInstallment) {
    return purchaseTurn
  }

  const payoffTurn = consumePayoffTurn(itemRef, purchaseTurn)
  if (payoffTurn != null) {
    return payoffTurn
  }

  if (inventoryItem?.isPaidOff) {
    return purchaseTurn
  }

  if (!inventoryItem) {
    return findSellTurnAfterPurchase(news, itemRef, purchaseTurn)
  }

  return null
}

function buildBuyDetails(
  operation: PropertyOperation,
  inventory: InventoryItemDto[],
  consumePayoffTurn: (itemRef: string, purchaseTurn: number) => number | null,
  news: news_item[],
  bankBaseRatePercent: number,
): PropertyOperationDetails {
  const inventoryItem = findInventoryMatch(inventory, operation.itemRef, operation.price)
  const isInstallment =
    inventoryItem?.isInstallment ?? operation.paymentLabel === formatPropertyPaymentLabel(true)
  const payment = resolveBuyPaymentDetails(
    operation.itemRef,
    operation.price,
    inventoryItem,
    isInstallment,
    bankBaseRatePercent,
  )

  return {
    firstPayment: payment.firstPayment,
    overpayment: payment.overpayment,
    purchaseTurn: operation.turnStep,
    finalPaymentTurn: resolveFinalPaymentTurn(
      operation.itemRef,
      operation.turnStep,
      isInstallment,
      inventoryItem,
      consumePayoffTurn,
      news,
    ),
  }
}

export function buildInventoryItemFinanceDetails(
  item: InventoryItemDto,
  news: news_item[],
  bankBaseRatePercent: number,
): PropertyOperationDetails {
  const lookup = buildPropertyPurchaseStepLookup(news)
  const purchaseTurn = resolvePropertyPurchaseStep(item.itemRef, item.purchasePrice, lookup)
  const consumePayoffTurn = buildPayoffTurnAssigner(news)
  const payment = resolveBuyPaymentDetails(
    item.itemRef,
    item.purchasePrice,
    item,
    item.isInstallment,
    bankBaseRatePercent,
  )

  return {
    firstPayment: payment.firstPayment,
    overpayment: payment.overpayment,
    purchaseTurn,
    finalPaymentTurn: resolveFinalPaymentTurn(
      item.itemRef,
      purchaseTurn,
      item.isInstallment,
      item,
      consumePayoffTurn,
      news,
    ),
  }
}

export function enrichPropertyOperationDetails(
  operations: PropertyOperation[],
  inventory: InventoryItemDto[],
  news: news_item[],
  bankBaseRatePercent: number,
): PropertyOperation[] {
  const consumePayoffTurn = buildPayoffTurnAssigner(news)
  const buys = operations
    .filter((operation) => operation.type === 'buy')
    .sort((a, b) => a.turnStep - b.turnStep)

  const buyDetails = new Map<string, PropertyOperationDetails>()
  for (const operation of buys) {
    buyDetails.set(operation.id, buildBuyDetails(operation, inventory, consumePayoffTurn, news, bankBaseRatePercent))
  }

  return operations.map((operation) => {
    if (operation.type === 'buy') {
      return {
        ...operation,
        details: buyDetails.get(operation.id) ?? null,
      }
    }

    const matchedBuy = [...buys]
      .filter(
        (entry) => entry.itemRef === operation.itemRef && entry.turnStep < operation.turnStep,
      )
      .sort((a, b) => b.turnStep - a.turnStep)[0]

    if (!matchedBuy) {
      return { ...operation, details: null }
    }

    const details = buyDetails.get(matchedBuy.id)
    if (!details) {
      return { ...operation, details: null }
    }

    return {
      ...operation,
      details: {
        ...details,
        finalPaymentTurn: details.finalPaymentTurn ?? operation.turnStep,
      },
    }
  })
}
