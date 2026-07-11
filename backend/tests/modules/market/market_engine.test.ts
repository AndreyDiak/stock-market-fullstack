import { describe, expect, it } from 'vitest';
import {
  calculateNextPrice,
  calculateVolatilityBoost,
  decayNewsPressureImpact,
  sumNewsPressures,
} from '../../../src/modules/market/market_engine.js';
import { STOCK_GRADE_CONFIG } from '../../../src/assets/stock_grade.js';
import {
  clampSentiment,
  getSentimentIndicator,
  processSentimentTurn,
  shiftSentiment,
} from '../../../src/modules/market/market_sentiment.engine.js';
import { shiftSectorMomentum, decaySectorMomentum } from '../../../src/modules/market/sector_momentum.engine.js';

describe('market_engine', () => {
  it('keeps price above $0.01 floor', () => {
    const result = calculateNextPrice(
      { currentPrice: 0.05, grade: 'F' },
      { newsPressureTotal: -10, sectorMomentum: -1, marketSentiment: -1, volatilityBoost: 1 },
      () => 0,
    );
    expect(result.newPrice).toBeGreaterThanOrEqual(0.01);
  });

  it('makes F-grade stocks move more than A-grade on same forces', () => {
    const forces = { newsPressureTotal: 1, sectorMomentum: 0.5, marketSentiment: 0.2, volatilityBoost: 1 };
    const fMove = Math.abs(
      calculateNextPrice({ currentPrice: 100, grade: 'F' }, forces, () => 0.5).dayChangePct,
    );
    const aMove = Math.abs(
      calculateNextPrice({ currentPrice: 100, grade: 'A' }, forces, () => 0.5).dayChangePct,
    );
    expect(fMove).toBeGreaterThan(aMove);
  });

  it('applies positive news pressure upward', () => {
    const baseline = calculateNextPrice(
      { currentPrice: 100, grade: 'D' },
      { newsPressureTotal: 0, sectorMomentum: 0, marketSentiment: 0, volatilityBoost: 1 },
      () => 0.5,
    );
    const pressured = calculateNextPrice(
      { currentPrice: 100, grade: 'D' },
      { newsPressureTotal: 2, sectorMomentum: 0, marketSentiment: 0, volatilityBoost: 1 },
      () => 0.5,
    );
    expect(pressured.newPrice).toBeGreaterThan(baseline.newPrice);
  });

  it('sums news pressures', () => {
    expect(sumNewsPressures([{ impact: 0.5 }, { impact: -0.2 }])).toBeCloseTo(0.3);
  });

  it('decays news pressure impact', () => {
    expect(decayNewsPressureImpact(1, 0.2)).toBeCloseTo(0.8);
  });

  it('respects grade volatility bounds', () => {
    for (const grade of ['F', 'E', 'D', 'C', 'B', 'A'] as const) {
      const max = STOCK_GRADE_CONFIG[grade].volatility[1];
      const result = calculateNextPrice(
        { currentPrice: 200, grade },
        { newsPressureTotal: 0, sectorMomentum: 0, marketSentiment: 0, volatilityBoost: 1 },
        () => 1,
      );
      expect(Math.abs(result.dayChangePct)).toBeLessThanOrEqual(max * 1.2 + 0.01);
    }
  });

  it('increases random move range when volatility boost is higher', () => {
    const baseline = Math.abs(
      calculateNextPrice(
        { currentPrice: 100, grade: 'D' },
        { newsPressureTotal: 0, sectorMomentum: 0, marketSentiment: 0, volatilityBoost: 1 },
        () => 0.9,
      ).dayChangePct,
    );
    const boosted = Math.abs(
      calculateNextPrice(
        { currentPrice: 100, grade: 'D' },
        { newsPressureTotal: 2, sectorMomentum: 0.6, marketSentiment: 0.4, volatilityBoost: 1.8 },
        () => 0.9,
      ).dayChangePct,
    );

    expect(boosted).toBeGreaterThanOrEqual(baseline);
    expect(
      calculateVolatilityBoost({
        newsPressureTotal: 2,
        sectorMomentum: 0.6,
        sectorDuration: 3,
        marketSentiment: 0.4,
      }),
    ).toBeGreaterThan(1);
  });
});

describe('market_sentiment.engine', () => {
  it('clamps sentiment to [-1, 1]', () => {
    expect(clampSentiment(2)).toBe(1);
    expect(clampSentiment(-3)).toBe(-1);
  });

  it('shifts sentiment within bounds', () => {
    expect(shiftSentiment(0.5, 0.3)).toBeCloseTo(0.8);
    expect(shiftSentiment(0.9, 0.5)).toBe(1);
  });

  it('drifts sentiment toward zero each turn', () => {
    expect(processSentimentTurn(0.6)).toBeCloseTo(0.55);
    expect(processSentimentTurn(0.03)).toBe(0);
  });

  it('maps indicator labels', () => {
    expect(getSentimentIndicator(-0.5)).toBe('bearish');
    expect(getSentimentIndicator(0)).toBe('neutral');
    expect(getSentimentIndicator(0.6)).toBe('bullish');
  });
});

describe('sector_momentum.engine', () => {
  it('shifts and clamps sector momentum', () => {
    expect(shiftSectorMomentum(0.2, 0.5)).toBe(0.7);
    expect(shiftSectorMomentum(0.9, 0.5)).toBe(1);
  });

  it('decays sector momentum after duration expires', () => {
    const decayed = decaySectorMomentum(0.4, 0);
    expect(decayed.value).toBeLessThan(0.4);
    expect(decayed.duration).toBe(0);
  });
});
