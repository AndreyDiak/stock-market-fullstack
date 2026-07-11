import { describe, expect, it } from 'vitest';
import { calcInsiderNewsChancePercent } from './types.js';

describe('calcInsiderNewsChancePercent', () => {
  it('equals professionLevel * 2', () => {
    expect(calcInsiderNewsChancePercent(1)).toBe(2);
    expect(calcInsiderNewsChancePercent(5)).toBe(10);
    expect(calcInsiderNewsChancePercent(10)).toBe(20);
    expect(calcInsiderNewsChancePercent(12)).toBe(24);
  });

  it('caps at 30% for levels above 15', () => {
    expect(calcInsiderNewsChancePercent(15)).toBe(30);
  });
});
