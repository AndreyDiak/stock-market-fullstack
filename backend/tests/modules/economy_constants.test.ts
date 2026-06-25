import { describe, expect, it } from 'vitest';
import {
  isSalaryTurn,
  turnsUntilSalary,
} from '../src/modules/game/_economy_constants.js';
import {
  generateLivingExpenses,
  sumLivingExpenses,
} from '../src/modules/game/_generators/_living_expense.generator.js';

describe('economy.constants', () => {
  it('pays salary on turns 5, 10, 15', () => {
    expect(isSalaryTurn(1)).toBe(false);
    expect(isSalaryTurn(4)).toBe(false);
    expect(isSalaryTurn(5)).toBe(true);
    expect(isSalaryTurn(10)).toBe(true);
  });

  it('counts turns until next salary', () => {
    expect(turnsUntilSalary(1)).toBe(4);
    expect(turnsUntilSalary(4)).toBe(1);
    expect(turnsUntilSalary(5)).toBe(0);
    expect(turnsUntilSalary(6)).toBe(4);
  });
});

describe('livingExpense.generator', () => {
  const gameId = '11111111-1111-1111-1111-111111111111';

  it('generates 1-3 receipts per turn', () => {
    const receipts = generateLivingExpenses(gameId, 1);
    expect(receipts.length).toBeGreaterThanOrEqual(1);
    expect(receipts.length).toBeLessThanOrEqual(3);
  });

  it('is deterministic for the same game and step', () => {
    const first = generateLivingExpenses(gameId, 3);
    const second = generateLivingExpenses(gameId, 3);
    expect(second).toEqual(first);
  });

  it('keeps amounts within catalog bounds', () => {
    const receipts = generateLivingExpenses(gameId, 7);
    for (const receipt of receipts) {
      expect(receipt.amount).toBeGreaterThanOrEqual(10);
      expect(receipt.amount).toBeLessThanOrEqual(200);
    }
    expect(sumLivingExpenses(receipts)).toBeGreaterThan(0);
  });
});
