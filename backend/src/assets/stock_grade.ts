export type StockGrade = 'F' | 'E' | 'D' | 'C' | 'B' | 'A';

export interface StockGradeConfig {
  volatility: [number, number];
  newsReactivity: number;
  priceRange: [number, number];
  availableOnExchange: boolean;
  minBankingLevel: number;
  minReputation: number;
  requiresInsiderAccess: boolean;
  dividendChance: number;
  dividendYield: [number, number];
  randomNoise: number;
}

export const STOCK_GRADE_CONFIG: Record<StockGrade, StockGradeConfig> = {
  F: {
    volatility: [5, 25],
    newsReactivity: 2.5,
    priceRange: [1, 30],
    availableOnExchange: true,
    minBankingLevel: 1,
    minReputation: 0,
    requiresInsiderAccess: false,
    dividendChance: 0.01,
    dividendYield: [0, 1],
    randomNoise: 1.2,
  },
  E: {
    volatility: [4, 18],
    newsReactivity: 2.0,
    priceRange: [20, 150],
    availableOnExchange: true,
    minBankingLevel: 2,
    minReputation: 0,
    requiresInsiderAccess: false,
    dividendChance: 0.03,
    dividendYield: [1, 3],
    randomNoise: 1.0,
  },
  D: {
    volatility: [3, 12],
    newsReactivity: 1.5,
    priceRange: [100, 600],
    availableOnExchange: true,
    minBankingLevel: 3,
    minReputation: 0,
    requiresInsiderAccess: false,
    dividendChance: 0.08,
    dividendYield: [2, 5],
    randomNoise: 0.85,
  },
  C: {
    volatility: [2, 8],
    newsReactivity: 1.0,
    priceRange: [400, 2000],
    availableOnExchange: true,
    minBankingLevel: 5,
    minReputation: 1,
    requiresInsiderAccess: false,
    dividendChance: 0.12,
    dividendYield: [3, 6],
    randomNoise: 0.7,
  },
  B: {
    volatility: [1, 5],
    newsReactivity: 0.7,
    priceRange: [1500, 8000],
    availableOnExchange: false,
    minBankingLevel: 7,
    minReputation: 3,
    requiresInsiderAccess: false,
    dividendChance: 0.2,
    dividendYield: [4, 8],
    randomNoise: 0.5,
  },
  A: {
    volatility: [0.5, 3],
    newsReactivity: 0.4,
    priceRange: [5000, 50000],
    availableOnExchange: false,
    minBankingLevel: 9,
    minReputation: 5,
    requiresInsiderAccess: true,
    dividendChance: 0.3,
    dividendYield: [5, 10],
    randomNoise: 0.35,
  },
};

export const STOCK_GRADES: StockGrade[] = ['F', 'E', 'D', 'C', 'B', 'A'];

export function isStockGrade(value: string): value is StockGrade {
  return STOCK_GRADES.includes(value as StockGrade);
}

export function randomPriceInGradeRange(grade: StockGrade, rng = Math.random): number {
  const [min, max] = STOCK_GRADE_CONFIG[grade].priceRange;
  const price = min + rng() * (max - min);
  return Math.max(0.01, Number(price.toFixed(2)));
}

export function pickInitialListingGrade(rng = Math.random): StockGrade {
  const roll = rng();
  if (roll < 0.55) return 'F';
  if (roll < 0.78) return 'E';
  if (roll < 0.92) return 'D';
  if (roll < 0.98) return 'C';
  return 'B';
}
