import { describe, expect, it } from 'vitest';
import type { InventoryItem } from '@prisma/client';
import {
  buildPropertySaleNewsFinance,
  formatPropertySaleNewsBody,
} from '../../src/modules/property_offers/_deal.js';

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: 'item-1',
    characterId: 'char-1',
    itemRef: 'sport_car',
    name: 'Автомобиль',
    purchasePrice: 35_000,
    downPaymentAmount: 5_250,
    isInstallment: true,
    monthlyPayment: 651,
    installmentsTotal: 60,
    installmentsPaid: 5,
    special: null,
    purchasedAt: new Date(),
    isPaidOff: false,
    ...overrides,
  };
}

describe('property sale news', () => {
  it('formats installment sale with full financial breakdown', () => {
    const item = makeItem();
    const salePrice = 54_090;
    const finance = buildPropertySaleNewsFinance(item, salePrice);
    const body = formatPropertySaleNewsBody('Автомобиль', finance);

    expect(finance.hasInstallmentBreakdown).toBe(true);
    expect(finance.balanceCredit).toBe(finance.paidOnLoan! + finance.priceDelta);
    expect(body).toContain('за 54 090');
    expect(body).toContain('Чистая прибыль: +19 090');
    expect(body).toContain('цена покупки — 35 000');
    expect(body).toContain('На баланс поступит');
    expect(body).toContain('выплачено по кредиту');
    expect(body).toContain('надбавка к цене покупки');
  });

  it('formats paid-off property sale without loan breakdown', () => {
    const item = makeItem({ isPaidOff: true, isInstallment: true });
    const salePrice = 54_090;
    const body = formatPropertySaleNewsBody(
      'Автомобиль',
      buildPropertySaleNewsFinance(item, salePrice),
    );

    expect(body).toContain('за 54 090');
    expect(body).toContain('Чистая прибыль: +19 090');
    expect(body).toContain('На баланс поступило 54 090');
    expect(body).not.toContain('выплачено по кредиту');
  });
});
