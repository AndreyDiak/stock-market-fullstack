import { describe, it, expect } from 'vitest';
import {
  calcPurchaseDiscountDiceRequirement,
  getMaxNegotiateDiscountPercent,
  MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL,
  normalizeNegotiatePercent,
  NEGOTIATE_PURCHASE_DISCOUNT_MIN,
  NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT,
  snapPurchaseDiscountPercent,
} from '../../src/modules/property_offers/_negotiate_discount.js';

describe('negotiate discount by trading level', () => {
  it('maps trading grades F through A to discount caps', () => {
    expect(getMaxNegotiateDiscountPercent(1)).toBe(15);
    expect(getMaxNegotiateDiscountPercent(2)).toBe(25);
    expect(getMaxNegotiateDiscountPercent(3)).toBe(30);
    expect(getMaxNegotiateDiscountPercent(4)).toBe(35);
    expect(getMaxNegotiateDiscountPercent(5)).toBe(42);
    expect(getMaxNegotiateDiscountPercent(6)).toBe(50);
  });

  it('exposes slider constants and discount table', () => {
    expect(MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL[1]).toBe(15);
    expect(NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT).toBe(50);
    expect(NEGOTIATE_PURCHASE_DISCOUNT_MIN).toBe(5);
  });

  it('snaps purchase discount to steps of 5 within limits', () => {
    expect(snapPurchaseDiscountPercent(7, 50)).toBe(5);
    expect(snapPurchaseDiscountPercent(23, 25)).toBe(25);
    expect(snapPurchaseDiscountPercent(3, 50)).toBe(5);
  });

  it('normalizes negotiate percent for trading level', () => {
    expect(normalizeNegotiatePercent(23, 2)).toBe(25);
    expect(normalizeNegotiatePercent(55, 1)).toBe(15);
    expect(normalizeNegotiatePercent(Number.NaN, 1)).toBe(5);
  });

  it('maps purchase discount percent to d20 requirement', () => {
    expect(calcPurchaseDiscountDiceRequirement(5)).toBe(11);
    expect(calcPurchaseDiscountDiceRequirement(10)).toBe(12);
    expect(calcPurchaseDiscountDiceRequirement(25)).toBe(15);
    expect(calcPurchaseDiscountDiceRequirement(45)).toBe(19);
    expect(calcPurchaseDiscountDiceRequirement(50)).toBe(20);
  });
});
