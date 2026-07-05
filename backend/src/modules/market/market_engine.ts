import type { StockGrade } from '../../assets/stock_grade.js';
import { STOCK_GRADE_CONFIG } from '../../assets/stock_grade.js';

export interface PriceForces {
  newsPressureTotal: number;
  sectorMomentum: number;
  marketSentiment: number;
}

export interface PriceUpdateResult {
  newPrice: number;
  dayChangePct: number;
}

export function calculateNextPrice(
  listing: { currentPrice: number; grade: StockGrade },
  forces: PriceForces,
  rng: () => number = Math.random,
): PriceUpdateResult {
  const config = STOCK_GRADE_CONFIG[listing.grade];
  const [volMin, volMax] = config.volatility;
  const volRange = volMin + rng() * (volMax - volMin);
  const randomDelta = (rng() * 2 - 1) * volRange * config.randomNoise;

  const newsDelta = forces.newsPressureTotal * config.newsReactivity;
  const sectorDelta = forces.sectorMomentum * 2;
  const sentimentDelta = forces.marketSentiment * 1.5;

  let deltaPercent = randomDelta + newsDelta + sectorDelta + sentimentDelta;
  const maxMove = volMax * 1.2;
  deltaPercent = Math.max(-maxMove, Math.min(maxMove, deltaPercent));

  const previousPrice = listing.currentPrice;
  const newPrice = Math.max(0.01, Number((previousPrice * (1 + deltaPercent / 100)).toFixed(2)));
  const dayChangePct =
    previousPrice > 0
      ? Number((((newPrice - previousPrice) / previousPrice) * 100).toFixed(2))
      : 0;

  return { newPrice, dayChangePct };
}

export function decayNewsPressureImpact(impact: number, decayRate: number): number {
  return impact * (1 - decayRate);
}

export function sumNewsPressures(pressures: { impact: number }[]): number {
  return pressures.reduce((sum, pressure) => sum + pressure.impact, 0);
}
