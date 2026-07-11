import type { news_item } from '../../_model/types'
import { format_turn_step_label, resolve_published_step } from '../../_model/utils'

interface PropertyDealPayload {
  action?: string
  assetId?: string
  price?: number
}

interface PropertyInstallmentPayload {
  assetId?: string
  amount?: number
  paidOff?: boolean
}

export interface InstallmentPaymentEntry {
  id: string
  turn: number
  amount: number
  label: string
}

export function isStarterInventoryProperty(
  itemRef: string,
  purchasePrice: number,
  news: news_item[],
): boolean {
  for (const item of news) {
    if (item.kind !== 'PROPERTY_DEAL') continue

    const payload = item.payload as PropertyDealPayload | undefined
    if (
      payload?.action === 'purchased' &&
      payload.assetId === itemRef &&
      payload.price === purchasePrice
    ) {
      return false
    }
  }

  return true
}

export function countMonthlyPaymentsFromLoanTotals(
  totalOwed: number,
  downPayment: number,
  monthlyPayment: number,
): number {
  if (monthlyPayment <= 0) return 0
  return Math.max(0, Math.round((totalOwed - downPayment) / monthlyPayment))
}

export function resolveLastPaymentTurn({
  purchaseTurn,
  finalPaymentTurn,
  currentTurn,
  isPaidOff,
}: {
  purchaseTurn: number
  finalPaymentTurn: number | null | undefined
  currentTurn: number
  isPaidOff: boolean
}): number {
  if (finalPaymentTurn != null && finalPaymentTurn > purchaseTurn) {
    return finalPaymentTurn
  }

  if (isPaidOff && currentTurn > purchaseTurn) {
    return currentTurn
  }

  return currentTurn
}

export function resolveMonthlyPaymentCount({
  installmentsPaid,
  purchaseTurn,
  finalPaymentTurn,
  currentTurn,
  isPaidOff,
  totalOwed,
  downPayment,
  monthlyPayment,
}: {
  installmentsPaid: number
  purchaseTurn: number
  finalPaymentTurn: number | null | undefined
  currentTurn: number
  isPaidOff: boolean
  totalOwed?: number
  downPayment?: number
  monthlyPayment: number
}): number {
  const lastTurn = resolveLastPaymentTurn({
    purchaseTurn,
    finalPaymentTurn,
    currentTurn,
    isPaidOff,
  })

  const countByTurn = Math.max(0, lastTurn - purchaseTurn)
  if (countByTurn > 0) {
    return countByTurn
  }

  if (!isPaidOff && installmentsPaid > 0) {
    return Math.min(installmentsPaid, Math.max(0, currentTurn - purchaseTurn))
  }

  if (
    isPaidOff &&
    totalOwed != null &&
    downPayment != null &&
    monthlyPayment > 0
  ) {
    const fullCount = countMonthlyPaymentsFromLoanTotals(totalOwed, downPayment, monthlyPayment)
    return Math.min(fullCount, Math.max(0, currentTurn - purchaseTurn))
  }

  return 0
}

function collectInstallmentNewsPayments(
  news: news_item[],
  itemRef: string,
  purchaseTurn: number,
  monthlyPayment: number,
): InstallmentPaymentEntry[] {
  const entries: InstallmentPaymentEntry[] = []

  for (const item of news) {
    if (item.kind !== 'PROPERTY_INSTALLMENT') continue

    const payload = item.payload as PropertyInstallmentPayload | undefined
    if (payload?.assetId !== itemRef) continue

    const turn = resolve_published_step(item)
    const amount = payload.amount ?? 0
    if (turn == null || turn < purchaseTurn || amount <= 0) continue

    const isEarlyPayoff =
      payload.paidOff === true &&
      monthlyPayment > 0 &&
      Math.abs(amount - monthlyPayment) > 0.01

    entries.push({
      id: `installment-news-${item.id}`,
      turn,
      amount,
      label: isEarlyPayoff
        ? `Досрочное погашение · ${format_turn_step_label(turn)}`
        : payload.paidOff
          ? `Последний платёж · ${format_turn_step_label(turn)}`
          : format_turn_step_label(turn),
    })
  }

  return entries.sort((a, b) => {
    if (a.turn !== b.turn) return a.turn - b.turn
    return a.id.localeCompare(b.id)
  })
}

function buildSyntheticMonthlyPayments(
  purchaseTurn: number,
  monthlyPayment: number,
  paymentCount: number,
): InstallmentPaymentEntry[] {
  const entries: InstallmentPaymentEntry[] = []

  for (let i = 1; i <= paymentCount; i++) {
    const turn = purchaseTurn + i
    entries.push({
      id: `monthly-${turn}`,
      turn,
      amount: monthlyPayment,
      label: format_turn_step_label(turn),
    })
  }

  return entries
}

export function buildInstallmentPaymentHistory({
  itemRef,
  purchaseTurn,
  monthlyPayment,
  installmentsPaid,
  finalPaymentTurn,
  currentTurn,
  news,
  isPaidOff = false,
  downPayment,
  totalOwed,
}: {
  itemRef: string
  purchaseTurn: number | null | undefined
  monthlyPayment: number
  installmentsPaid: number
  finalPaymentTurn: number | null | undefined
  currentTurn: number
  news: news_item[]
  isPaidOff?: boolean
  downPayment?: number
  totalOwed?: number
}): InstallmentPaymentEntry[] {
  if (!purchaseTurn || monthlyPayment <= 0) return []

  const newsPayments = collectInstallmentNewsPayments(
    news,
    itemRef,
    purchaseTurn,
    monthlyPayment,
  )

  const paymentCount = resolveMonthlyPaymentCount({
    installmentsPaid,
    purchaseTurn,
    finalPaymentTurn,
    currentTurn,
    isPaidOff,
    totalOwed,
    downPayment,
    monthlyPayment,
  })

  const entries = buildSyntheticMonthlyPayments(purchaseTurn, monthlyPayment, paymentCount)

  for (const newsEntry of newsPayments) {
    const monthlyIndex = entries.findIndex(
      (entry) => entry.turn === newsEntry.turn && entry.id.startsWith('monthly-'),
    )

    if (monthlyIndex >= 0 && newsEntry.label.startsWith('Досрочное погашение')) {
      entries.push(newsEntry)
      continue
    }

    if (monthlyIndex >= 0) {
      entries[monthlyIndex] = newsEntry
      continue
    }

    entries.push(newsEntry)
  }

  return entries.sort((a, b) => {
    if (a.turn !== b.turn) return a.turn - b.turn
    if (a.id.startsWith('monthly-')) return -1
    if (b.id.startsWith('monthly-')) return 1
    return a.id.localeCompare(b.id)
  })
}

export function resolveDownPaymentLabel({
  itemRef,
  purchasePrice,
  purchaseTurn,
  news,
}: {
  itemRef: string
  purchasePrice: number
  purchaseTurn: number | null | undefined
  news: news_item[]
}): string {
  if (!purchaseTurn) return 'Первоначальный взнос'

  if (isStarterInventoryProperty(itemRef, purchasePrice, news)) {
    return 'Первоначальный взнос · до начала игры'
  }

  return `Первоначальный взнос · ${format_turn_step_label(purchaseTurn)}`
}
