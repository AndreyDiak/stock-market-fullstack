import type { PriceHistoryPoint } from '../../../../api/stocks';

export const SPARKLINE_WINDOW_POINTS = 14;

export function buildSparklinePolyline(
  history: PriceHistoryPoint[],
  width: number,
  height: number,
  padding = 4,
): string {
  if (history.length === 0) return '';

  const prices = history.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || Math.max(max * 0.02, 0.01);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return history
    .map((point, index) => {
      const x = padding + (index / Math.max(history.length - 1, 1)) * innerWidth;
      const y = padding + innerHeight - ((point.price - min) / range) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');
}

export function getHistoryWindowChangePct(
  history: PriceHistoryPoint[],
  windowSize = SPARKLINE_WINDOW_POINTS,
): number | null {
  if (history.length < 2) return null;

  const window = history.slice(-windowSize);
  if (window.length < 2) return null;

  const startPrice = window[0]!.price;
  const endPrice = window[window.length - 1]!.price;
  if (startPrice <= 0) return null;

  return Number((((endPrice - startPrice) / startPrice) * 100).toFixed(2));
}

export function getHistoryWindowMeta(
  history: PriceHistoryPoint[],
  windowSize = SPARKLINE_WINDOW_POINTS,
) {
  const window = history.slice(-windowSize);

  return {
    pointsInWindow: window.length,
    changePct: getHistoryWindowChangePct(history, windowSize),
  };
}

export function getSparklineDisplayHistory(
  history: PriceHistoryPoint[],
  windowSize = SPARKLINE_WINDOW_POINTS,
): PriceHistoryPoint[] {
  return history.slice(-windowSize);
}

export function resolveListingHistory(
  _listing: {
    id: string;
    ticker: string;
    grade: string;
    currentPrice: number;
    previousPrice: number;
  },
  history: PriceHistoryPoint[] = [],
): PriceHistoryPoint[] {
  const byTurn = new Map<number, PriceHistoryPoint>();

  for (const point of history) {
    byTurn.set(point.turn, point);
  }

  return [...byTurn.values()]
    .sort((left, right) => left.turn - right.turn)
    .slice(-20);
}
