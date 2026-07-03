import { describe, expect, it } from 'vitest';
import { calcInstallmentPurchasePlan } from '../../src/modules/property_offers/_installment_purchase.js';

describe('calcInstallmentPurchasePlan', () => {
  it('applies bank interest to total cost and derives monthly payment from remainder', () => {
    const plan = calcInstallmentPurchasePlan({
      purchasePrice: 37227,
      downPaymentPercent: 15,
      installmentsTotal: 60,
      bankingLevel: 1,
    });

    expect(plan.interestRatePercent).toBe(20);
    expect(plan.totalWithInterest).toBe(44672);
    expect(plan.overpayment).toBe(7445);
    expect(plan.downPayment).toBe(5584);
    expect(plan.monthlyPayment).toBe(651);
    expect(plan.downPayment + plan.monthlyPayment * plan.installmentsTotal).toBe(44644);
  });

  it('lowers interest rate with higher banking level', () => {
    const plan = calcInstallmentPurchasePlan({
      purchasePrice: 100_000,
      downPaymentPercent: 20,
      installmentsTotal: 12,
      bankingLevel: 6,
    });

    expect(plan.interestRatePercent).toBe(10);
    expect(plan.totalWithInterest).toBe(110_000);
    expect(plan.downPayment).toBe(20_000);
    expect(plan.monthlyPayment).toBe(7500);
  });
});
