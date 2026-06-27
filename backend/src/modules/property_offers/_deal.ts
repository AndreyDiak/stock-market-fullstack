import type { InventoryItem } from '@prisma/client';
import type { PropertyOfferType } from './_types.js';

export function calcReputationAfterSuccessfulTrade(reputation: number, tradeSuccessStreak: number) {
  let newReputation = reputation + 0.1;
  let newStreak = tradeSuccessStreak + 1;
  if (newStreak >= 10) {
    newReputation += 0.9;
    newStreak = 0;
  }
  return {
    reputation: Math.min(10, newReputation),
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
  netProfit: number;
}

export function calcInstallmentSaleBreakdown(
  item: InventoryItem,
  saleProceeds: number,
): InstallmentSaleBreakdown | null {
  if (!item.isInstallment || item.isPaidOff) return null;

  const monthlyPayment = item.monthlyPayment ?? 0;
  const installmentsTotal = item.installmentsTotal ?? 0;
  const paidTotal = item.installmentsPaid * monthlyPayment;
  const remainingTotal = Math.max(0, installmentsTotal - item.installmentsPaid) * monthlyPayment;
  const netProfit = saleProceeds - paidTotal - remainingTotal;

  return {
    paidTotal,
    remainingTotal,
    saleProceeds,
    netProfit,
  };
}
