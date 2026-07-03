import { describe, it, expect } from 'vitest';
import {
  calcDownPaymentPercent,
  calcDownPaymentAmount,
  calcOfferPrice,
  calcProfitPercent,
  gradeFromPercent,
  isProfitableForPlayer,
  requiredBankingLevel,
} from '../../src/modules/property_offers/_profit.js';
import { buildOfferParams } from '../../src/modules/property_offers/_generator.js';
import {
  getNextCycleCategory,
  kindToNewsCategory,
  pickNextContentType,
} from '../../src/modules/news/news_cycle.js';
import {
  calcNegotiateSuccessChance,
  calcNegotiateTarget,
  calcProposedPrice,
  calcPurchaseNegotiateSuccessChance,
  calcPurchaseNegotiateTarget,
} from '../../src/modules/property_offers/_negotiate.js';

describe('property offer negotiate slider', () => {
  it('maps purchase discount to fixed d20 requirement', () => {
    expect(calcPurchaseNegotiateTarget(5)).toBe(11);
    expect(calcPurchaseNegotiateTarget(25)).toBe(15);
    expect(calcPurchaseNegotiateTarget(50)).toBe(20);
  });

  it('maps sell markup adjustment to D20 target', () => {
    expect(calcNegotiateTarget(-15)).toBe(5);
    expect(calcNegotiateTarget(50)).toBe(19);
    expect(calcNegotiateTarget(15)).toBe(12);
  });

  it('calculates purchase success chance from reputation', () => {
    expect(calcPurchaseNegotiateSuccessChance(25, 2)).toBe(40);
    expect(calcPurchaseNegotiateSuccessChance(5, 0)).toBe(50);
  });

  it('calculates sell success chance from reputation', () => {
    expect(calcNegotiateSuccessChance(-15, 3)).toBeGreaterThan(80);
    expect(calcNegotiateSuccessChance(50, 3)).toBeLessThan(20);
  });

  it('calculates proposed price by offer type', () => {
    expect(calcProposedPrice('BUY', 1000, 10)).toBe(1100);
    expect(calcProposedPrice('SELL', 1000, 10)).toBe(900);
  });
});

describe('property offer profit', () => {
  it('maps down payment percent by grade', () => {
    expect(calcDownPaymentPercent('F')).toBe(15);
    expect(calcDownPaymentPercent('A')).toBe(40);
  });

  it('calculates down payment amount from offer price', () => {
    expect(calcDownPaymentAmount(10_000, 15)).toBe(1500);
    expect(calcDownPaymentAmount(10_000, 40)).toBe(4000);
  });

  it('maps grades to banking levels', () => {
    expect(requiredBankingLevel('F')).toBe(1);
    expect(requiredBankingLevel('C')).toBe(4);
    expect(requiredBankingLevel('A')).toBe(6);
  });

  it('calculates profitable BUY offer', () => {
    const marketPrice = 1500;
    const offerPrice = calcOfferPrice('BUY', marketPrice, 7, true);
    expect(offerPrice).toBe(1605);
    expect(isProfitableForPlayer('BUY', offerPrice, marketPrice)).toBe(true);
    expect(calcProfitPercent('BUY', offerPrice, marketPrice)).toBeCloseTo(7, 1);
    expect(gradeFromPercent(7, true)).toBe('F');
  });

  it('marks unprofitable offers as grade F', () => {
    const marketPrice = 1500;
    const offerPrice = 1400;
    expect(isProfitableForPlayer('BUY', offerPrice, marketPrice)).toBe(false);
    expect(gradeFromPercent(-6.67, false)).toBe('F');
    expect(requiredBankingLevel('F')).toBe(1);
  });

  it('generates hot offers with TTL 1 and grade C or higher', () => {
    let hotFound = false;
    for (let i = 0; i < 200; i++) {
      const params = buildOfferParams({
        gameId: 'game-1',
        gameStep: 5,
        inventoryItems: [],
        random: () => 0.01,
        forceHot: true,
      });
      if (!params) continue;
      hotFound = true;
      expect(params.isHot).toBe(true);
      expect(params.expiresInTurns).toBe(1);
      expect(['C', 'B', 'A']).toContain(params.profitGrade);
      expect(params.profitPercent).toBeGreaterThan(0);
    }
    expect(hotFound).toBe(true);
  });

  it('generates forced grade offers for starter deals', () => {
    const fOffer = buildOfferParams({
      gameId: 'g1',
      gameStep: 1,
      inventoryItems: [],
      forcedGrade: 'F',
    });
    const eOffer = buildOfferParams({
      gameId: 'g1',
      gameStep: 1,
      inventoryItems: [],
      forcedGrade: 'E',
      excludeAssetIds: fOffer ? [fOffer.assetId] : [],
    });

    expect(fOffer?.profitGrade).toBe('F');
    expect(fOffer?.requiredBankingLevel).toBe(1);
    expect(eOffer?.profitGrade).toBe('E');
    expect(eOffer?.requiredBankingLevel).toBe(2);
    if (fOffer && eOffer) {
      expect(fOffer.assetId).not.toBe(eOffer.assetId);
    }
  });
});

describe('news cycle', () => {
  it('maps news kinds to cycle categories', () => {
    expect(kindToNewsCategory('MARKET')).toBe('stock');
    expect(kindToNewsCategory('INSIDER')).toBe('stock');
    expect(kindToNewsCategory('RUMOR')).toBe('stock');
    expect(kindToNewsCategory('OTC_DEAL')).toBe('deal');
    expect(kindToNewsCategory('PROPERTY_OFFER')).toBe('realty');
  });

  it('rotates categories stock -> deal -> realty', () => {
    expect(getNextCycleCategory(null)).toBe('stock');
    expect(getNextCycleCategory('stock')).toBe('deal');
    expect(getNextCycleCategory('deal')).toBe('realty');
    expect(getNextCycleCategory('realty')).toBe('stock');
  });

  it('picks next turn content from last news kind', () => {
    expect(pickNextContentType(null)).toBe('stock');
    expect(pickNextContentType('MARKET')).toBe('otc');
    expect(pickNextContentType('RUMOR')).toBe('otc');
    expect(pickNextContentType('INSIDER')).toBe('otc');
    expect(pickNextContentType('OTC_DEAL')).toBe('property');
    expect(pickNextContentType('PROPERTY_OFFER')).toBe('stock');
  });
});
