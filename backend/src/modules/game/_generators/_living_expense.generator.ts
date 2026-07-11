import {
  LIVING_EXPENSES,
  LIVING_EXPENSE_CATEGORY_WEIGHTS,
  type LivingExpenseCategory,
  type LivingExpenseItem,
} from '../../../assets/living_expenses.js';

export interface LivingExpenseReceipt {
  itemId: string;
  title: string;
  amount: number;
}

export const LIVING_EXPENSE_RECEIPTS_MIN = 1;
export const LIVING_EXPENSE_RECEIPTS_MAX = 3;

function hashSeed(gameId: string, step: number): number {
  const input = `${gameId}:${step}:living`;
  let hash = 2166136261;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedCategory(rng: () => number): LivingExpenseCategory {
  const entries = Object.entries(LIVING_EXPENSE_CATEGORY_WEIGHTS) as Array<
    [LivingExpenseCategory, number]
  >;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = rng() * total;

  for (const [category, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return category;
  }

  return entries[entries.length - 1]![0];
}

function pickItem(
  category: LivingExpenseCategory,
  rng: () => number,
  usedIds: Set<string>,
): LivingExpenseItem | null {
  const pool = LIVING_EXPENSES.filter(
    (item) => item.category === category && !usedIds.has(item.id),
  );
  if (pool.length === 0) return null;

  return pool[Math.floor(rng() * pool.length)]!;
}

function rollAmount(item: LivingExpenseItem, rng: () => number): number {
  const span = item.maxAmount - item.minAmount;
  return item.minAmount + Math.floor(rng() * (span + 1));
}

/** Детерминированные чеки за ход: 1–3 позиции, одинаковые в прогнозе и при списании. */
export function generateLivingExpenses(gameId: string, step: number): LivingExpenseReceipt[] {
  const rng = createRng(hashSeed(gameId, step));
  const receiptCount =
    LIVING_EXPENSE_RECEIPTS_MIN +
    Math.floor(rng() * (LIVING_EXPENSE_RECEIPTS_MAX - LIVING_EXPENSE_RECEIPTS_MIN + 1));

  const receipts: LivingExpenseReceipt[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < receiptCount; i++) {
    let item: LivingExpenseItem | null = null;

    for (let attempt = 0; attempt < 8 && !item; attempt++) {
      const category = pickWeightedCategory(rng);
      item = pickItem(category, rng, usedIds);
    }

    if (!item) {
      const fallbackPool = LIVING_EXPENSES.filter((entry) => !usedIds.has(entry.id));
      if (fallbackPool.length === 0) break;
      item = fallbackPool[Math.floor(rng() * fallbackPool.length)]!;
    }

    usedIds.add(item.id);
    receipts.push({
      itemId: item.id,
      title: item.title,
      amount: rollAmount(item, rng),
    });
  }

  return receipts;
}

export function sumLivingExpenses(receipts: LivingExpenseReceipt[]): number {
  return receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
}
