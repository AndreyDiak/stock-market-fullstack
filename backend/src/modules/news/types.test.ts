import { describe, expect, it } from 'vitest';
import { calcInsiderNewsChancePercent } from './types.js';

describe('calcInsiderNewsChancePercent', () => {
  it('equals professionLevel * 2', () => {
    expect(calcInsiderNewsChancePercent(1)).toBe(2);
    expect(calcInsiderNewsChancePercent(5)).toBe(10);
    expect(calcInsiderNewsChancePercent(10)).toBe(20);
  });

  it('caps at 20% for levels above 10', () => {
    expect(calcInsiderNewsChancePercent(15)).toBe(20);
  });
});
