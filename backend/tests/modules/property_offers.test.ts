import { describe, it, expect } from 'vitest';
import type { InventoryItem } from '@prisma/client';
import {
  calcDownPaymentPercent,
  calcDownPaymentAmount,
  calcOfferPrice,
  calcProfitPercent,
  gradeFromPercent,
  isProfitableForPlayer,
  requiredBankingLevel,
  randomPercentInGrade,
} from '../../src/modules/property_offers/_profit.js';
import { buildOfferParams } from '../../src/modules/property_offers/_generator.js';
import { REAL_ESTATE } from '../../src/assets/real_estate.js';
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
    expect(calcNegotiateTarget(15)).toBe(11);
  });

  it('calculates purchase success chance from reputation', () => {
    expect(calcPurchaseNegotiateSuccessChance(25, 2)).toBe(40);
    expect(calcPurchaseNegotiateSuccessChance(5, 0)).toBe(50);
  });

  it('calculates sell success chance from reputation', () => {
    expect(calcNegotiateSuccessChance(-15, 3)).toBeGreaterThan(80);
    expect(calcNegotiateSuccessChance(50, 3)).toBe(25);
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

  it('limits grade A discount to 50-60%', () => {
    for (let i = 0; i < 200; i++) {
      const percent = randomPercentInGrade('A', Math.random);
      expect(percent).toBeGreaterThanOrEqual(50);
      expect(percent).toBeLessThanOrEqual(60);
    }
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

  it('does not generate BUY offer for asset or inventory item already on market', () => {
    const apartmentItem = {
      id: 'inv-apartment-1',
      itemRef: 'apartment',
      name: 'Квартира',
      purchasePrice: 80_000,
      isInstallment: false,
      isPaidOff: true,
    } as InventoryItem;

    const blockedByAsset = buildOfferParams({
      gameId: 'g1',
      gameStep: 5,
      inventoryItems: [apartmentItem],
      random: () => 0.5,
      excludeAssetIds: ['apartment'],
    });
    expect(blockedByAsset?.type).not.toBe('BUY');
    expect(blockedByAsset?.assetId).not.toBe('apartment');

    const blockedByInventory = buildOfferParams({
      gameId: 'g1',
      gameStep: 5,
      inventoryItems: [apartmentItem],
      random: () => 0.5,
      excludeInventoryItemIds: ['inv-apartment-1'],
    });
    expect(blockedByInventory?.inventoryItemId).not.toBe('inv-apartment-1');
  });

  it('does not offer deal-only luxury assets on the property market', () => {
    const dealOnlyIds = REAL_ESTATE.filter((asset) => asset.dealOnly).map((asset) => asset.id);
    expect(dealOnlyIds.length).toBeGreaterThan(0);
    expect(dealOnlyIds).toContain('penthouse');
    expect(dealOnlyIds).toContain('sport_car');

    for (let i = 0; i < 500; i++) {
      const params = buildOfferParams({
        gameId: 'game-1',
        gameStep: 5,
        inventoryItems: [],
        random: Math.random,
      });
      if (!params) continue;
      expect(dealOnlyIds).not.toContain(params.assetId);
    }
  });

  it('does not generate BUY offer for deal-only luxury in player inventory', () => {
    const luxuryItem = {
      id: 'inv-car-wash',
      itemRef: 'car_wash',
      name: 'Автомойка',
      purchasePrice: 150_000,
      isInstallment: false,
      isPaidOff: true,
    } as InventoryItem;

    for (let i = 0; i < 100; i++) {
      const params = buildOfferParams({
        gameId: 'game-1',
        gameStep: 5,
        inventoryItems: [luxuryItem],
        random: () => 0.5,
      });
      if (!params) continue;
      expect(params.assetId).not.toBe('car_wash');
      expect(params.inventoryItemId).not.toBe('inv-car-wash');
    }
  });

  it('does not generate BUY offer for deal-only sport car in player inventory', () => {
    const luxuryItem = {
      id: 'inv-sport-car',
      itemRef: 'sport_car',
      name: 'Спорткар',
      purchasePrice: 180_000,
      isInstallment: false,
      isPaidOff: true,
    } as InventoryItem;

    for (let i = 0; i < 100; i++) {
      const params = buildOfferParams({
        gameId: 'game-1',
        gameStep: 5,
        inventoryItems: [luxuryItem],
        random: () => 0.5,
      });
      if (!params) continue;
      expect(params.assetId).not.toBe('sport_car');
      expect(params.inventoryItemId).not.toBe('inv-sport-car');
    }
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
    expect(pickNextContentType('MARKET')).toBe('deal');
    expect(pickNextContentType('RUMOR')).toBe('deal');
    expect(pickNextContentType('INSIDER')).toBe('deal');
    expect(pickNextContentType('OTC_DEAL')).toBe('property');
    expect(pickNextContentType('PROPERTY_OFFER')).toBe('stock');
  });
});
