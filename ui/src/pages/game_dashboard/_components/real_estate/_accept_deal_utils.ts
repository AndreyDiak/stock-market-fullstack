import type { InventoryItemDto } from '../../_model/game_mappers';

import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate';
import type { PropertyOffer } from '../../_model/types';
import { calcInstallmentPurchasePlan, resolveDownPaymentAmount } from './_installment_purchase';



export type PropertyOfferPaymentMode = 'full' | 'installment';



export interface InstallmentSaleBreakdown {

  paidTotal: number;

  remainingTotal: number;

  saleProceeds: number;

  purchasePrice: number;

  priceDelta: number;

  netProfit: number;

}



export interface AcceptDealPreview {

  isPurchase: boolean;

  profitAmount: number;

  projectedReputation: number;

  reputationDelta: number;

  installmentBreakdown: InstallmentSaleBreakdown | null;

  downPaymentAmount: number | null;

  saleBalanceCredit: number | null;

  purchasePrice: number | null;

}



export function calcDownPaymentAmount(offerPrice: number, downPaymentPercent: number) {

  return Math.round((offerPrice * downPaymentPercent) / 100);

}



export interface PurchaseInstallmentPlan {

  downPayment: number;

  installmentsTotal: number;

  monthlyPayment: number;

  totalWithInterest: number;

  overpayment: number;

  interestRatePercent: number;

}



export function getPurchaseInstallmentPlan(

  assetId: string,

  purchasePrice: number,

  downPaymentPercent: number,

  interestRatePercent: number,

): PurchaseInstallmentPlan | null {

  const catalog = REAL_ESTATE_CATALOG.find((item) => item.id === assetId);

  if (!catalog || catalog.installmentMonths <= 0) {

    return null;

  }



  return calcInstallmentPurchasePlan({

    purchasePrice,

    downPaymentPercent,

    installmentsTotal: catalog.installmentMonths,

    interestRatePercent,

  });

}



export const INSUFFICIENT_DOWN_PAYMENT_REASON = 'Недостаточно средств для взноса';

export const INSUFFICIENT_FULL_PAYMENT_REASON = 'Недостаточно средств для полной оплаты';

export const INSUFFICIENT_BALANCE_FOR_NEGOTIATE_REASON =

  'Недостаточно средств для взноса по предложенной цене';



export function hasInsufficientDownPayment(

  balance: number,

  isPurchase: boolean,

  offerPrice: number,

  downPaymentPercent: number,

): boolean {

  if (!isPurchase) return false;

  return balance < calcDownPaymentAmount(offerPrice, downPaymentPercent);

}



export function hasInsufficientFullPayment(

  balance: number,

  isPurchase: boolean,

  offerPrice: number,

): boolean {

  if (!isPurchase) return false;

  return balance < offerPrice;

}



export function canAffordPurchase(

  balance: number,

  price: number,

  downPaymentPercent: number,

  paymentMode: PropertyOfferPaymentMode,

): boolean {

  if (paymentMode === 'full') {

    return balance >= price;

  }

  return balance >= calcDownPaymentAmount(price, downPaymentPercent);

}



export function getDefaultPurchasePaymentMode(

  balance: number,

  price: number,

): PropertyOfferPaymentMode {

  if (balance >= price) return 'full';

  return 'installment';

}



export function hasInsufficientNegotiatePurchaseFunds(

  balance: number,

  isPurchase: boolean,

  proposedPrice: number,

  downPaymentPercent: number,

): boolean {

  if (!isPurchase) return false;

  return balance < calcDownPaymentAmount(proposedPrice, downPaymentPercent);

}



export function calcDealProfitAmount(

  type: PropertyOffer['type'],

  offerPrice: number,

  marketPrice: number,

): number {

  return type === 'BUY' ? offerPrice - marketPrice : marketPrice - offerPrice;

}



function getDownPaymentAmount(item: InventoryItemDto): number {
  return resolveDownPaymentAmount(item);
}



export function calcPaidLoanAmount(item: InventoryItemDto): number {

  if (!item.isInstallment || item.isPaidOff) {

    return item.isPaidOff ? item.purchasePrice : 0;

  }



  const monthlyPayment = item.monthlyPayment ?? 0;

  return getDownPaymentAmount(item) + item.installmentsPaid * monthlyPayment;

}



export function calcInstallmentSaleRevenue(

  item: InventoryItemDto,

  saleOfferPrice: number,

): number {

  if (!item.isInstallment || item.isPaidOff) {

    return saleOfferPrice;

  }



  return calcPaidLoanAmount(item) + (saleOfferPrice - item.purchasePrice);

}



export function calcInstallmentSaleBreakdown(

  item: InventoryItemDto,

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

  item: InventoryItemDto | undefined,

  saleProceeds: number,

): number {

  if (!item) return saleProceeds;

  if (!item.isInstallment || item.isPaidOff) return saleProceeds;

  return Math.max(0, calcInstallmentSaleRevenue(item, saleProceeds));

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

  const owned =

    !isPurchase && offer.inventoryItemId

      ? inventoryItems.find((item) => item.id === offer.inventoryItemId)

      : undefined;

  const purchasePrice = owned?.purchasePrice ?? null;

  const profitAmount = isPurchase

    ? calcDealProfitAmount(offer.type, offer.offerPrice, offer.marketPrice)

    : purchasePrice != null

      ? offer.offerPrice - purchasePrice

      : calcDealProfitAmount(offer.type, offer.offerPrice, offer.marketPrice);

  const { projected, delta } = calcProjectedReputation(reputation);



  const installmentBreakdown =

    owned && !isPurchase ? calcInstallmentSaleBreakdown(owned, offer.offerPrice) : null;



  const downPaymentAmount = isPurchase

    ? calcDownPaymentAmount(offer.offerPrice, offer.downPaymentPercent)

    : null;



  const saleBalanceCredit =

    !isPurchase && owned

      ? calcSaleBalanceCredit(owned, offer.offerPrice)

      : null;



  return {

    isPurchase,

    profitAmount,

    projectedReputation: projected,

    reputationDelta: delta,

    installmentBreakdown,

    downPaymentAmount,

    saleBalanceCredit,

    purchasePrice,

  };

}

