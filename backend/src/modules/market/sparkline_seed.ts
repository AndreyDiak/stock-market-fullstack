import type { StockGrade } from '../../assets/stock_grade.js';
import { STOCK_GRADE_CONFIG } from '../../assets/stock_grade.js';

export const WARMUP_HISTORY_POINTS = 14;

export interface SparklineSeedPoint {
  turn: number;
  price: number;
}

function seededRng(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = Math.imul(31, hash) + seed.charCodeAt(i);
  }

  return () => {
    hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296;
  };
}

/** Synthetic pre-game history. Uses negative turn indices so real game steps never collide. */
export function buildWarmupSparkline(input: {
  gameId: string;
  listingId: string;
  ticker: string;
  grade: StockGrade;
  currentPrice: number;
  count?: number;
}): SparklineSeedPoint[] {
  const count = input.count ?? WARMUP_HISTORY_POINTS;
  const rng = seededRng(`${input.gameId}:${input.listingId}:${input.ticker}`);
  const [minPrice] = STOCK_GRADE_CONFIG[input.grade].priceRange;
  const volatilityScale =
    input.grade === 'F' ? 1.45 : input.grade === 'E' ? 1.2 : input.grade === 'A' ? 0.75 : 1;
  const volatility = input.currentPrice * 0.028 * volatilityScale;
  const startPrice = Math.max(
    minPrice * 0.75,
    input.currentPrice * (input.grade === 'F' ? 0.86 : 0.93),
  );

  const points: SparklineSeedPoint[] = [];

  for (let index = 0; index < count; index += 1) {
    const turn = index - (count - 1);
    const progress = index / Math.max(count - 1, 1);
    const trend = startPrice + (input.currentPrice - startPrice) * progress;
    const wobble = (rng() - 0.5) * volatility * 2;
    const price = Math.max(0.01, Number((trend + wobble).toFixed(2)));
    points.push({ turn, price });
  }

  points[points.length - 1] = {
    turn: 0,
    price: Number(input.currentPrice.toFixed(2)),
  };

  return points;
}

export function buildWarmupHistoryRecords(input: {
  gameId: string;
  companyId: string;
  listingId: string;
  ticker: string;
  grade: StockGrade;
  currentPrice: number;
  count?: number;
}) {
  return buildWarmupSparkline(input).map((point) => ({
    gameId: input.gameId,
    companyId: input.companyId,
    stockListingId: input.listingId,
    turn: point.turn,
    price: point.price,
  }));
}
