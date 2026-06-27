import type { InventoryItemDto } from '../../_model/game_mappers';
import type { PropertyOffer } from '../../_model/types';

export interface InstallmentSaleBreakdown {
  paidTotal: number;
  remainingTotal: number;
  saleProceeds: number;
  netProfit: number;
}

export interface AcceptDealPreview {
  isPurchase: boolean;
  profitAmount: number;
  projectedReputation: number;
  reputationDelta: number;
  installmentBreakdown: InstallmentSaleBreakdown | null;
  downPaymentAmount: number | null;
}

export function calcDealProfitAmount(
  type: PropertyOffer['type'],
  offerPrice: number,
  marketPrice: number,
): number {
  return type === 'BUY' ? offerPrice - marketPrice : marketPrice - offerPrice;
}

export function calcInstallmentSaleBreakdown(
  item: InventoryItemDto,
  saleProceeds: number,
): InstallmentSaleBreakdown | null {
  if (!item.isInstallment || item.isPaidOff) return null;

  const monthlyPayment = item.monthlyPayment ?? 0;
  const installmentsTotal = item.installmentsTotal ?? 0;
  const paidTotal = item.installmentsPaid * monthlyPayment;
  const remainingTotal = Math.max(0, installmentsTotal - item.installmentsPaid) * monthlyPayment;

  return {
    paidTotal,
    remainingTotal,
    saleProceeds,
    netProfit: saleProceeds - paidTotal - remainingTotal,
  };
}

export function calcProjectedReputation(reputation: number): {
  projected: number;
  delta: number;
} {
  const projected = Math.min(10, reputation + 0.1);
  return {
    projected,
    delta: projected - reputation,
  };
}

export function buildAcceptDealPreview(
  offer: PropertyOffer,
  reputation: number,
  inventoryItems: InventoryItemDto[],
): AcceptDealPreview {
  const isPurchase = offer.type === 'SELL';
  const profitAmount = calcDealProfitAmount(offer.type, offer.offerPrice, offer.marketPrice);
  const { projected, delta } = calcProjectedReputation(reputation);

  const owned =
    !isPurchase && offer.inventoryItemId
      ? inventoryItems.find((item) => item.id === offer.inventoryItemId)
      : undefined;

  const installmentBreakdown =
    owned && !isPurchase ? calcInstallmentSaleBreakdown(owned, offer.offerPrice) : null;

  const downPaymentAmount = isPurchase
    ? Math.round((offer.offerPrice * offer.downPaymentPercent) / 100)
    : null;

  return {
    isPurchase,
    profitAmount,
    projectedReputation: projected,
    reputationDelta: delta,
    installmentBreakdown,
    downPaymentAmount,
  };
}
