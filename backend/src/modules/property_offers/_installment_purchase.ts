import type { InventoryItem } from '@prisma/client';
import { calcBankBaseRate } from '../character_skills/_calculations.js';
import { calcDownPaymentPercent } from './_profit.js';

export interface InstallmentPurchasePlan {
  downPayment: number;
  installmentsTotal: number;
  monthlyPayment: number;
  totalWithInterest: number;
  overpayment: number;
  interestRatePercent: number;
}

export function calcInstallmentPurchasePlan(input: {
  purchasePrice: number;
  downPaymentPercent: number;
  installmentsTotal: number;
  bankingLevel: number;
}): InstallmentPurchasePlan {
  const interestRatePercent = calcBankBaseRate(input.bankingLevel);
  const downPayment = Math.round((input.purchasePrice * input.downPaymentPercent) / 100);
  const totalWithInterest = Math.round(input.purchasePrice * (1 + interestRatePercent / 100));
  const remainingTotal = Math.max(0, totalWithInterest - downPayment);
  const installmentsTotal = Math.max(1, input.installmentsTotal);
  const monthlyPayment = Math.round(remainingTotal / installmentsTotal);

  return {
    downPayment,
    installmentsTotal,
    monthlyPayment,
    totalWithInterest,
    overpayment: totalWithInterest - input.purchasePrice,
    interestRatePercent,
  };
}

export function resolveDownPaymentAmount(item: InventoryItem): number {
  if (item.downPaymentAmount != null) {
    return item.downPaymentAmount;
  }

  if (!item.isInstallment || item.isPaidOff) {
    return 0;
  }

  const installmentsTotal = item.installmentsTotal ?? 0;
  if (installmentsTotal <= 0) {
    return 0;
  }

  return calcInstallmentPurchasePlan({
    purchasePrice: item.purchasePrice,
    downPaymentPercent: calcDownPaymentPercent('F'),
    installmentsTotal,
    bankingLevel: 1,
  }).downPayment;
}

export function buildInstallmentInventoryFields(input: {
  purchasePrice: number;
  installmentsTotal: number;
  bankingLevel?: number;
  downPaymentPercent?: number;
  installmentsPaid?: number;
}) {
  const plan = calcInstallmentPurchasePlan({
    purchasePrice: input.purchasePrice,
    downPaymentPercent: input.downPaymentPercent ?? calcDownPaymentPercent('F'),
    installmentsTotal: input.installmentsTotal,
    bankingLevel: input.bankingLevel ?? 1,
  });

  return {
    downPaymentAmount: plan.downPayment,
    monthlyPayment: plan.monthlyPayment,
    installmentsTotal: plan.installmentsTotal,
    installmentsPaid: input.installmentsPaid ?? 0,
  };
}

export function calcInstallmentTotalOwed(item: InventoryItem): number {
  if (!item.isInstallment) {
    return item.isPaidOff ? item.purchasePrice : 0;
  }

  if (item.monthlyPayment != null && item.installmentsTotal != null) {
    return resolveDownPaymentAmount(item) + item.monthlyPayment * item.installmentsTotal;
  }

  return item.purchasePrice;
}
