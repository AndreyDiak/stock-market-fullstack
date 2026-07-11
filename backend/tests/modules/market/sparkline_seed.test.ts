import { describe, expect, it } from 'vitest';
import { buildWarmupSparkline, WARMUP_HISTORY_POINTS } from '../../../src/modules/market/sparkline_seed.js';

describe('buildWarmupSparkline', () => {
  it('creates 14 deterministic points ending at current price', () => {
    const input = {
      gameId: 'game-1',
      listingId: 'listing-1',
      ticker: 'AERO',
      grade: 'F' as const,
      currentPrice: 20,
    };

    const first = buildWarmupSparkline(input);
    const second = buildWarmupSparkline(input);

    expect(first).toHaveLength(WARMUP_HISTORY_POINTS);
    expect(second).toEqual(first);
    expect(first[0]?.turn).toBe(-(WARMUP_HISTORY_POINTS - 1));
    expect(first.at(-1)).toEqual({ turn: 0, price: 20 });
  });

  it('uses negative turns so real game steps do not collide', () => {
    const points = buildWarmupSparkline({
      gameId: 'game-2',
      listingId: 'listing-2',
      ticker: 'APEX',
      grade: 'E' as const,
      currentPrice: 42.5,
    });

    expect(points.every((point) => point.turn <= 0)).toBe(true);
    expect(points.some((point) => point.turn > 0)).toBe(false);
  });
});
