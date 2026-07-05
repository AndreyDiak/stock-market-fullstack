import type { InventoryItem } from '@prisma/client';
import {
  calcInstallmentTotalOwed,
  resolveDownPaymentAmount,
} from './_installment_purchase.js';
import type { PropertyOfferType } from './_types.js';

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
  return (
    getDownPaymentAmount(item) +
    item.installmentsPaid * monthlyPayment +
    (item.installmentPrepay ?? 0)
  );
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

export function calcInstallmentEarlyPayAmount(
  remaining: number,
  payPercent: number,
  balance: number,
): number {
  const normalizedPercent = Math.min(100, Math.max(5, Math.round(payPercent / 5) * 5));
  const amount =
    normalizedPercent >= 100 ? remaining : Math.round((remaining * normalizedPercent) / 100);
  return Math.min(Math.max(0, amount), balance, remaining);
}

export interface ApplyEarlyInstallmentPaymentResult {
  isPaidOff: boolean;
  installmentsPaid: number;
  installmentPrepay: number;
  paymentAmount: number;
}

export function applyEarlyInstallmentPayment(
  item: InventoryItem,
  paymentAmount: number,
): ApplyEarlyInstallmentPaymentResult {
  const totalOwed = calcInstallmentTotalOwed(item);
  const paidBefore = calcPaidLoanAmount(item);
  const remaining = Math.max(0, totalOwed - paidBefore);
  const amount = Math.min(Math.max(0, paymentAmount), remaining);

  if (amount <= 0) {
    throw new Error('Invalid installment payment amount');
  }

  const monthly = item.monthlyPayment ?? 0;
  const installmentsTotal = item.installmentsTotal ?? item.installmentsPaid;
  let prepay = (item.installmentPrepay ?? 0) + amount;
  let installmentsPaid = item.installmentsPaid;

  while (monthly > 0 && prepay >= monthly && installmentsPaid < installmentsTotal) {
    prepay -= monthly;
    installmentsPaid += 1;
  }

  const paidAfter =
    resolveDownPaymentAmount(item) + installmentsPaid * monthly + prepay;
  const isPaidOff = paidAfter >= totalOwed - 0.01 || installmentsPaid >= installmentsTotal;

  return {
    isPaidOff,
    installmentsPaid: isPaidOff ? installmentsTotal : installmentsPaid,
    installmentPrepay: isPaidOff ? 0 : prepay,
    paymentAmount: amount,
  };
}

export interface PropertySaleNewsFinance {
  salePrice: number;
  balanceCredit: number;
  purchasePrice: number;
  paidOnLoan: number | null;
  priceDelta: number;
  netProfit: number;
  hasInstallmentBreakdown: boolean;
}

function formatMoneyLabel(amount: number): string {
  return Math.abs(amount).toLocaleString('ru-RU');
}

function formatSignedMoneyLabel(amount: number): string {
  const label = formatMoneyLabel(amount);
  if (amount > 0) return `+${label}`;
  if (amount < 0) return `−${label}`;
  return label;
}

export function buildPropertySaleNewsFinance(
  item: InventoryItem | undefined,
  salePrice: number,
): PropertySaleNewsFinance {
  const purchasePrice = item?.purchasePrice ?? 0;
  const breakdown = item ? calcInstallmentSaleBreakdown(item, salePrice) : null;
  const balanceCredit = calcSaleBalanceCredit(item, salePrice);
  const priceDelta = salePrice - purchasePrice;

  if (breakdown) {
    return {
      salePrice,
      balanceCredit,
      purchasePrice: breakdown.purchasePrice,
      paidOnLoan: breakdown.paidTotal,
      priceDelta: breakdown.priceDelta,
      netProfit: breakdown.netProfit,
      hasInstallmentBreakdown: true,
    };
  }

  return {
    salePrice,
    balanceCredit,
    purchasePrice,
    paidOnLoan: null,
    priceDelta,
    netProfit: balanceCredit - purchasePrice,
    hasInstallmentBreakdown: false,
  };
}

export function formatPropertySaleNewsBody(itemName: string, finance: PropertySaleNewsFinance): string {
  const priceLabel = formatMoneyLabel(finance.salePrice);
  const parts = [`Вы продали «${itemName}» за ${priceLabel}.`];

  if (finance.purchasePrice > 0) {
    parts.push(
      `Чистая прибыль: ${formatSignedMoneyLabel(finance.priceDelta)} (цена покупки — ${formatMoneyLabel(finance.purchasePrice)}).`,
    );
  } else {
    parts.push(`Чистая прибыль: ${formatSignedMoneyLabel(finance.priceDelta)}.`);
  }

  if (finance.hasInstallmentBreakdown && finance.paidOnLoan != null) {
    const deltaWord = finance.priceDelta >= 0 ? 'надбавка' : 'убыток';
    parts.push(
      `На баланс поступит ${formatMoneyLabel(finance.balanceCredit)}: ${formatSignedMoneyLabel(finance.paidOnLoan)} выплачено по кредиту и ${formatSignedMoneyLabel(finance.priceDelta)} ${deltaWord} к цене покупки.`,
    );
  } else {
    parts.push(`На баланс поступило ${formatMoneyLabel(finance.balanceCredit)}.`);
  }

  return parts.join(' ');
}
