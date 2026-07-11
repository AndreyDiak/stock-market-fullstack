import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@prisma/client';
import {
  applyEarlyInstallmentPayment,
  calcInstallmentEarlyPayAmount,
  calcPaidLoanAmount,
} from '../../src/modules/property_offers/_deal.js';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    characterId: 'char-1',
    itemRef: 'dacha',
    name: 'Дача',
    purchasePrice: 22_449,
    downPaymentAmount: 3_367,
    isInstallment: true,
    monthlyPayment: 463,
    installmentsTotal: 48,
    installmentsPaid: 0,
    installmentPrepay: 0,
    special: null,
    purchasedAt: new Date(),
    isPaidOff: false,
    ...overrides,
  };
}

describe('installment early payment', () => {
  it('calculates pay amount from percent', () => {
    expect(calcInstallmentEarlyPayAmount(10_000, 25, 50_000)).toBe(2_500);
    expect(calcInstallmentEarlyPayAmount(10_000, 100, 50_000)).toBe(10_000);
    expect(calcInstallmentEarlyPayAmount(10_000, 100, 5_000)).toBe(5_000);
  });

  it('applies partial payment via prepay buffer', () => {
    const item = makeItem();
    const applied = applyEarlyInstallmentPayment(item, 2_500);

    expect(applied.isPaidOff).toBe(false);
    expect(applied.installmentPrepay).toBe(2_500);
    expect(calcPaidLoanAmount({ ...item, installmentPrepay: applied.installmentPrepay })).toBe(5_867);
  });

  it('rolls prepay into installments and pays off fully', () => {
    const item = makeItem();
    const remaining = 26_191 - calcPaidLoanAmount(item);
    const applied = applyEarlyInstallmentPayment(item, remaining);

    expect(applied.isPaidOff).toBe(true);
    expect(applied.installmentsPaid).toBe(48);
    expect(applied.installmentPrepay).toBe(0);
  });
});
