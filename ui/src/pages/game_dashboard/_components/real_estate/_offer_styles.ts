import type { profit_grade } from '../../_model/types';

export const PROFIT_GRADE_RANGES: Record<
  profit_grade,
  { min: number; max: number; banking: number }
> = {
  F: { min: 0, max: 10, banking: 1 },
  E: { min: 10, max: 20, banking: 2 },
  D: { min: 20, max: 30, banking: 3 },
  C: { min: 30, max: 40, banking: 4 },
  B: { min: 40, max: 50, banking: 5 },
  A: { min: 50, max: 60, banking: 6 },
};

const PROFIT_GRADES_BY_BANKING: profit_grade[] = ['F', 'E', 'D', 'C', 'B', 'A'];

export function bankingLevelToProfitGrade(bankingLevel: number): profit_grade {
  return PROFIT_GRADES_BY_BANKING[
    Math.max(0, Math.min(bankingLevel - 1, PROFIT_GRADES_BY_BANKING.length - 1))
  ] ?? 'F';
}

export function getProfitGradeTooltip(grade: profit_grade) {
  const range = PROFIT_GRADE_RANGES[grade];

  return {
    title: `Категория ${grade}`,
    lines: [
      `Выгода от ${range.min}% до ${range.max}% относительно рыночной цены`,
      `Доступна с Banking ${range.banking}+`,
    ],
  };
}

export const PROFIT_GRADE_STYLES: Record<
  profit_grade,
  { label: string; badge: string; text: string; card: string }
> = {
  F: {
    label: 'F',
    badge: 'border-slate-500/40 bg-slate-500/15 text-slate-300',
    text: 'text-slate-400',
    card: 'border-2 border-slate-500/50 shadow-[0_0_18px_rgba(100,116,139,0.15)]',
  },
  E: {
    label: 'E',
    badge: 'border-white/20 bg-white/10 text-white',
    text: 'text-white',
    card: 'border-2 border-white/25 shadow-[0_0_18px_rgba(255,255,255,0.08)]',
  },
  D: {
    label: 'D',
    badge: 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300',
    text: 'text-emerald-400',
    card: 'border-2 border-emerald-500/45 shadow-[0_0_20px_rgba(16,185,129,0.18)]',
  },
  C: {
    label: 'C',
    badge: 'border-sky-500/35 bg-sky-500/15 text-sky-300',
    text: 'text-sky-400',
    card: 'border-2 border-sky-500/45 shadow-[0_0_20px_rgba(14,165,233,0.18)]',
  },
  B: {
    label: 'B',
    badge: 'border-violet-500/35 bg-violet-500/15 text-violet-300',
    text: 'text-violet-400',
    card: 'border-2 border-violet-500/45 shadow-[0_0_20px_rgba(139,92,246,0.2)]',
  },
  A: {
    label: 'A',
    badge: 'border-amber-400/45 bg-amber-400/15 text-amber-200',
    text: 'text-amber-300',
    card: 'border-2 border-amber-400/55 shadow-[0_0_22px_rgba(251,191,36,0.22)]',
  },
};

export function formatGradeRequiredLabel(grade: profit_grade) {
  return `Доступно от ${grade} категории`;
}

export function formatBankingRequiredLabel(requiredBankingLevel: number) {
  const grade = bankingLevelToProfitGrade(requiredBankingLevel);
  return `Нужен уровень банковского дела ${grade}`;
}

export function formatTradingRequiredLabel(requiredTradingLevel: number) {
  const grades = ['F', 'E', 'D', 'C', 'B', 'A'];
  const grade = grades[Math.max(0, Math.min(requiredTradingLevel - 1, grades.length - 1))] ?? 'F';
  return `Требуется уровень трейдинга ${grade}`;
}

export type AssetDealType = 'buy' | 'sell';

export function getPlayerDealType(offerType: 'BUY' | 'SELL'): AssetDealType {
  return offerType === 'SELL' ? 'buy' : 'sell';
}

export function getDealTypeLabel(dealType: AssetDealType): string {
  return dealType === 'buy' ? 'Покупка' : 'Продажа';
}

export function getPriceCaption(dealType: AssetDealType): string {
  return dealType === 'buy' ? 'К оплате' : 'К получению';
}

export function getPrimaryActionLabel(dealType: AssetDealType): string {
  return dealType === 'buy' ? 'Купить' : 'Продать';
}

export function formatOfferTypeLabel(type: 'BUY' | 'SELL') {
  return type === 'BUY' ? 'Продажа' : 'Покупка';
}

export function formatOfferPriceVsMarket(offerPrice: number, marketPrice: number) {
  const diff = Math.abs(offerPrice - marketPrice);
  if (diff === 0) return 'На уровне рынка';

  const percent = ((diff / marketPrice) * 100).toFixed(1).replace('.', ',');
  return offerPrice > marketPrice
    ? `Выше рынка на ${percent}%`
    : `Ниже рынка на ${percent}%`;
}

export function getMarketComparisonCaption(offerPrice: number, marketPrice: number) {
  const diff = offerPrice - marketPrice;
  if (diff === 0) return 'На уровне рынка';
  return diff > 0 ? 'Выше рынка' : 'Ниже рынка';
}

export function formatMarketComparisonPercent(offerPrice: number, marketPrice: number) {
  const diff = offerPrice - marketPrice;
  if (diff === 0) return '0%';

  const percent = ((Math.abs(diff) / marketPrice) * 100).toFixed(1).replace('.', ',');
  return diff > 0 ? `+${percent}%` : `−${percent}%`;
}

export function getOfferStatusLabel(isHotDeal: boolean) {
  return isHotDeal ? 'Горячее предложение' : 'Рынок';
}
