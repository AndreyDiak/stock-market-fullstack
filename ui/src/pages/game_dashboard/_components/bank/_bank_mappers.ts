import type { InventoryItemDto } from '../../_model/game_mappers'
import { calcPaidLoanAmount } from '../real_estate/_accept_deal_utils'
import { calcInstallmentTotalOwed } from '../real_estate/_installment_purchase'
import type { ActiveLoan, BankSummary, PaidProperty } from './index'

function hasActiveInstallmentDebt(item: InventoryItemDto): boolean {
  if (!item.isInstallment || item.isPaidOff) return false

  const installmentsTotal = item.installmentsTotal ?? 0
  if (installmentsTotal > 0 && item.installmentsPaid >= installmentsTotal) {
    return false
  }

  return calcPaidLoanAmount(item) < calcInstallmentTotalOwed(item)
}

function calcPaybackPct(item: InventoryItemDto): number {
  if (!item.isInstallment || item.isPaidOff) return 100

  const totalOwed = calcInstallmentTotalOwed(item)
  const paidTotal = calcPaidLoanAmount(item)

  if (totalOwed <= 0) return 100
  return Math.min(100, Math.round((paidTotal / totalOwed) * 100))
}

function calcTurnsRemaining(item: InventoryItemDto, remainingAmount: number): number {
  const installmentsTotal = item.installmentsTotal ?? 0
  if (installmentsTotal > 0) {
    return Math.max(0, installmentsTotal - item.installmentsPaid)
  }

  const monthlyPayment = item.monthlyPayment ?? 0
  if (monthlyPayment <= 0) return 0
  return Math.ceil(remainingAmount / monthlyPayment)
}

function mapActiveLoan(item: InventoryItemDto): ActiveLoan {
  const totalOwed = calcInstallmentTotalOwed(item)
  const paidAmount = calcPaidLoanAmount(item)
  const remainingAmount = Math.max(0, totalOwed - paidAmount)
  const paymentPerTurn = item.monthlyPayment ?? 0

  return {
    id: item.id,
    itemRef: item.itemRef,
    name: item.name,
    purchasePrice: item.purchasePrice,
    paidAmount,
    remainingAmount,
    paymentPerTurn,
    turnsRemaining: calcTurnsRemaining(item, remainingAmount),
    paybackPct: calcPaybackPct(item),
    initialDebt: totalOwed,
    remainingDebt: remainingAmount,
  }
}

function mapPaidProperty(item: InventoryItemDto): PaidProperty {
  const wasInstallment = item.isInstallment
  const totalPaid = wasInstallment ? calcInstallmentTotalOwed(item) : item.purchasePrice

  return {
    id: item.id,
    itemRef: item.itemRef,
    name: item.name,
    purchasePrice: item.purchasePrice,
    totalPaid,
    wasInstallment,
  }
}

export function mapInventoryToBankState(items: InventoryItemDto[]): {
  activeLoans: ActiveLoan[]
  paidProperties: PaidProperty[]
  summary: BankSummary
} {
  const activeLoans = items.filter(hasActiveInstallmentDebt).map(mapActiveLoan)
  const paidProperties = items
    .filter((item) => item.isPaidOff && !hasActiveInstallmentDebt(item))
    .map(mapPaidProperty)

  const totalDebt = activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0)
  const paymentPerTurn = activeLoans.reduce((sum, loan) => sum + loan.paymentPerTurn, 0)

  return {
    activeLoans,
    paidProperties,
    summary: {
      totalDebt,
      paymentPerTurn,
      turnsUntilNextCharge: activeLoans.length > 0 ? 1 : 0,
    },
  }
}
