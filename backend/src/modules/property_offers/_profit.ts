import type { ProfitGrade, PropertyOfferType } from './_types.js';

const GRADE_RANGES: { grade: ProfitGrade; min: number; max: number; banking: number }[] = [
  { grade: 'F', min: 0, max: 10, banking: 1 },
  { grade: 'E', min: 10, max: 20, banking: 2 },
  { grade: 'D', min: 20, max: 30, banking: 3 },
  { grade: 'C', min: 30, max: 40, banking: 4 },
  { grade: 'B', min: 40, max: 50, banking: 5 },
  { grade: 'A', min: 50, max: 100, banking: 6 },
];

export function gradeFromPercent(percent: number, profitable: boolean): ProfitGrade {
  if (!profitable) return 'F';
  const abs = Math.abs(percent);
  for (let i = GRADE_RANGES.length - 1; i >= 0; i--) {
    const range = GRADE_RANGES[i]!;
    if (abs >= range.min) return range.grade;
  }
  return 'F';
}

export function requiredBankingLevel(grade: ProfitGrade): number {
  return GRADE_RANGES.find((r) => r.grade === grade)?.banking ?? 1;
}

const DOWN_PAYMENT_BY_GRADE: Record<ProfitGrade, number> = {
  F: 15,
  E: 20,
  D: 25,
  C: 30,
  B: 35,
  A: 40,
};

export function calcDownPaymentPercent(grade: ProfitGrade): number {
  return DOWN_PAYMENT_BY_GRADE[grade];
}

export function calcDownPaymentAmount(offerPrice: number, downPaymentPercent: number): number {
  return Math.round((offerPrice * downPaymentPercent) / 100);
}

export function isProfitableForPlayer(
  type: PropertyOfferType,
  offerPrice: number,
  marketPrice: number,
): boolean {
  if (type === 'BUY') return offerPrice > marketPrice;
  return offerPrice < marketPrice;
}

export function calcProfitPercent(
  type: PropertyOfferType,
  offerPrice: number,
  marketPrice: number,
): number {
  const raw = (Math.abs(offerPrice - marketPrice) / marketPrice) * 100;
  const profitable = isProfitableForPlayer(type, offerPrice, marketPrice);
  return profitable ? raw : -raw;
}

export function calcOfferPrice(
  type: PropertyOfferType,
  marketPrice: number,
  profitPercent: number,
  profitable: boolean,
): number {
  const absPercent = Math.abs(profitPercent) / 100;
  if (type === 'BUY') {
    return profitable
      ? Math.round(marketPrice * (1 + absPercent))
      : Math.round(marketPrice * (1 - absPercent));
  }
  return profitable
    ? Math.round(marketPrice * (1 - absPercent))
    : Math.round(marketPrice * (1 + absPercent));
}

export function randomPercentInGrade(grade: ProfitGrade, random: () => number): number {
  const range = GRADE_RANGES.find((r) => r.grade === grade)!;
  const span = range.max - range.min;
  return range.min + random() * (span > 0 ? span : 0.01);
}

export const pickRandomGrade = (
  minGrade: ProfitGrade,
  random: () => number,
): ProfitGrade => {
  const grades: ProfitGrade[] = ['F', 'E', 'D', 'C', 'B', 'A'];
  const minIndex = grades.indexOf(minGrade);
  const eligible = grades.slice(minIndex);
  return eligible[Math.floor(random() * eligible.length)]!;
};
