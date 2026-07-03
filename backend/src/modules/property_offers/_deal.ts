import type { InventoryItem } from '@prisma/client';
import {
  calcInstallmentTotalOwed,
  resolveDownPaymentAmount,
} from './_installment_purchase.js';

export function roundReputation(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calcReputationAfterSuccessfulTrade(reputation: number, tradeSuccessStreak: number) {
  let newReputation = reputation + 0.1;
  let newStreak = tradeSuccessStreak + 1;
  if (newStreak >= 10) {
    newReputation += 0.9;
    newStreak = 0;
  }
  return {
    reputation: roundReputation(Math.min(10, newReputation)),
    tradeSuccessStreak: newStreak,
  };
}

export function calcDealProfitAmount(
  type: PropertyOfferType,
  offerPrice: number,
  marketPrice: number,
): number {
  return type === 'BUY' ? offerPrice - marketPrice : marketPrice - offerPrice;
}

export interface InstallmentSaleBreakdown {
  paidTotal: number;
  remainingTotal: number;
  saleProceeds: number;
  purchasePrice: number;
  priceDelta: number;
  netProfit: number;
}

export function getDownPaymentAmount(item: InventoryItem): number {
  return resolveDownPaymentAmount(item);
}

export function calcPaidLoanAmount(item: InventoryItem): number {
  if (!item.isInstallment || item.isPaidOff) {
    return item.isPaidOff ? item.purchasePrice : 0;
  }

  const monthlyPayment = item.monthlyPayment ?? 0;
  return getDownPaymentAmount(item) + item.installmentsPaid * monthlyPayment;
}

export function hasActiveInstallmentDebt(item: InventoryItem): boolean {
  if (!item.isInstallment || item.isPaidOff) return false;

  if (item.installmentsTotal != null && item.installmentsPaid >= item.installmentsTotal) {
    return false;
  }

  return calcPaidLoanAmount(item) < calcInstallmentTotalOwed(item);
}

export function calcInstallmentSaleRevenue(item: InventoryItem, saleOfferPrice: number): number {
  if (!item.isInstallment || item.isPaidOff) {
    return saleOfferPrice;
  }

  return calcPaidLoanAmount(item) + (saleOfferPrice - item.purchasePrice);
}

export function calcInstallmentSaleBreakdown(
  item: InventoryItem,
  saleProceeds: number,
): InstallmentSaleBreakdown | null {
  if (!item.isInstallment || item.isPaidOff) return null;

  const monthlyPayment = item.monthlyPayment ?? 0;
  const installmentsTotal = item.installmentsTotal ?? 0;
  const paidTotal = calcPaidLoanAmount(item);
  const remainingTotal = Math.max(0, installmentsTotal - item.installmentsPaid) * monthlyPayment;
  const priceDelta = saleProceeds - item.purchasePrice;
  const netProfit = paidTotal + priceDelta;

  return {
    paidTotal,
    remainingTotal,
    saleProceeds,
    purchasePrice: item.purchasePrice,
    priceDelta,
    netProfit,
  };
}

export function calcSaleBalanceCredit(
  item: InventoryItem | undefined,
  saleProceeds: number,
): number {
  if (!item) return saleProceeds;
  if (!item.isInstallment || item.isPaidOff) return saleProceeds;
  return Math.max(0, calcInstallmentSaleRevenue(item, saleProceeds));
}

export type PropertyOfferPaymentMode = 'full' | 'installment';
