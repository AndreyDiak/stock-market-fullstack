import { describe, expect, it } from 'vitest';
import {
  calcNetSellProceeds,
  calcSellCommissionPercent,
} from '../../../src/modules/market/sell_commission.js';

describe('sell_commission', () => {
  it('maps trading level 1–6 to commission 10%→5%', () => {
    expect(calcSellCommissionPercent(1)).toBe(10);
    expect(calcSellCommissionPercent(2)).toBe(9);
    expect(calcSellCommissionPercent(3)).toBe(8);
    expect(calcSellCommissionPercent(4)).toBe(7);
    expect(calcSellCommissionPercent(5)).toBe(6);
    expect(calcSellCommissionPercent(6)).toBe(5);
  });

  it('clamps out-of-range trading levels', () => {
    expect(calcSellCommissionPercent(0)).toBe(10);
    expect(calcSellCommissionPercent(99)).toBe(5);
  });

  it('calculates net proceeds after commission', () => {
    const result = calcNetSellProceeds(1000, 1);
    expect(result.gross).toBe(1000);
    expect(result.commissionPercent).toBe(10);
    expect(result.commissionAmount).toBe(100);
    expect(result.net).toBe(900);
  });

  it('applies minimum commission at max trading level', () => {
    const result = calcNetSellProceeds(200, 6);
    expect(result.commissionPercent).toBe(5);
    expect(result.commissionAmount).toBe(10);
    expect(result.net).toBe(190);
  });
});
