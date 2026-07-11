import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@prisma/client';
import {
  calcInstallmentSaleBreakdown,
  calcPaidLoanAmount,
  calcSaleBalanceCredit,
  hasActiveInstallmentDebt,
} from '../../src/modules/property_offers/_deal.js';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    characterId: 'char-1',
    itemRef: 'sport_car',
    name: 'Спорткар',
    purchasePrice: 172_775,
    downPaymentAmount: 25_916,
    isInstallment: true,
    monthlyPayment: 3500,
    installmentsTotal: 72,
    installmentsPaid: 2,
    special: null,
    purchasedAt: new Date(),
    isPaidOff: false,
    ...overrides,
  };
}

describe('installment sale revenue', () => {
  it('counts paid loan as down payment plus installments', () => {
    const item = makeItem();
    expect(calcPaidLoanAmount(item)).toBe(25_916 + 2 * 3500);
  });

  it('credits paid loan plus price delta on sale', () => {
    const item = makeItem();
    const offerPrice = 180_000;
    const paidLoan = 25_916 + 7000;
    const expected = paidLoan + (offerPrice - item.purchasePrice);

    expect(calcSaleBalanceCredit(item, offerPrice)).toBe(expected);
    expect(calcInstallmentSaleBreakdown(item, offerPrice)?.netProfit).toBe(expected);
  });

  it('uses full offer price for paid-off property', () => {
    const item = makeItem({ isInstallment: false, isPaidOff: true, downPaymentAmount: null });
    expect(calcSaleBalanceCredit(item, 180_000)).toBe(180_000);
  });

  it('infers down payment for legacy installment items without stored down payment', () => {
    const item = makeItem({
      downPaymentAmount: null,
      purchasePrice: 35_000,
      monthlyPayment: 651,
      installmentsTotal: 60,
      installmentsPaid: 5,
    });

    const paidLoan = Math.round(35_000 * 0.15) + 5 * 651;
    const offerPrice = 40_000;

    expect(calcPaidLoanAmount(item)).toBe(paidLoan);
    expect(calcSaleBalanceCredit(item, offerPrice)).toBe(paidLoan + (offerPrice - 35_000));
  });

  it('treats installment as closed when paid amount reaches purchase price', () => {
    const item = makeItem({
      itemRef: 'parking_spot',
      name: 'Парковочное место',
      purchasePrice: 8000,
      downPaymentAmount: 1200,
      monthlyPayment: 300,
      installmentsTotal: 30,
      installmentsPaid: 23,
    });

    expect(calcPaidLoanAmount(item)).toBe(8100);
    expect(hasActiveInstallmentDebt(item)).toBe(false);
  });
});
