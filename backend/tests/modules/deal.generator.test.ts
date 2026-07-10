import { describe, expect, it } from 'vitest';
import { Profession } from '@prisma/client';
import { buildDeal } from '../../src/modules/deals/deal.builder.js';
import type { DealBuildContext } from '../../src/modules/deals/deal.builder.js';
import { DealGenerator } from '../../src/modules/deals/deal.generator.js';
import type { DealPurpose } from '../../src/modules/deals/deal.types.js';
import {
  PURPOSE_MIN_PAY_RATIO,
  calcTargetPlayerValue,
  validateDeal,
} from '../../src/modules/deals/deal.validator.js';

function makeContext(overrides: Partial<DealBuildContext> = {}): DealBuildContext {
  return {
    gameId: 'game-1',
    gameStep: 5,
    playerCharacter: {
      id: 'player-1',
      balance: 25000,
      reputation: 5,
      tradingLevel: 3,
      profession: Profession.FARMER,
      dreamItemRefs: ['tractor', 'yacht'],
      name: 'Игрок',
    } as DealBuildContext['playerCharacter'],
    npcCharacter: {
      id: 'npc-1',
      name: 'Бот',
      profession: Profession.FINANCIER,
      tradingLevel: 4,
      reputation: 6,
    } as DealBuildContext['npcCharacter'],
    availableStocks: [
      {
        id: 'listing-lend',
        gameId: 'game-1',
        companyId: 'company-lend',
        currentPrice: 180,
        availableOnExchange: true,
        company: { ticker: 'LEND' },
      },
      {
        id: 'listing-tech',
        gameId: 'game-1',
        companyId: 'company-tech',
        currentPrice: 420,
        availableOnExchange: true,
        company: { ticker: 'TECH' },
      },
    ] as DealBuildContext['availableStocks'],
    playerStocks: [
      { ticker: 'LEND', shares: 40, listingId: 'listing-lend', currentPrice: 180 },
    ],
    playerProperties: [
      { propertyId: 'garage', propertyName: 'Гараж', estimatedValue: 5000 },
    ],
    ...overrides,
  };
}

describe('deal validator', () => {
  it('rejects deals where player pays far less than bot gives', () => {
    const error = validateDeal({
      purpose: 'DREAM_HELPER',
      botGives: {
        assets: [{ type: 'PROPERTY', propertyId: 'tractor', propertyName: 'Трактор', estimatedValue: 45000 }],
        totalEstimatedValue: 45000,
      },
      playerGives: {
        assets: [
          { type: 'CASH', cashAmount: 3919, estimatedValue: 3919 },
          { type: 'STOCK', ticker: 'LEND', shares: 8, estimatedValue: 1440 },
        ],
        totalEstimatedValue: 5359,
      },
      playerCharacter: makeContext().playerCharacter,
      playerStocks: makeContext().playerStocks,
      playerProperties: makeContext().playerProperties,
      availableStocks: makeContext().availableStocks,
    });

    expect(error).toMatch(/PLAYER_PAYS_TOO_LITTLE|GLOBAL_BENEFIT_OUT_OF_RANGE/);
  });

  it('rejects property in non-dream deals', () => {
    const error = validateDeal({
      purpose: 'VALUE_EXCHANGE',
      botGives: {
        assets: [{ type: 'PROPERTY', propertyId: 'car', propertyName: 'Авто', estimatedValue: 35000 }],
        totalEstimatedValue: 35000,
      },
      playerGives: {
        assets: [{ type: 'CASH', cashAmount: 32000, estimatedValue: 32000 }],
        totalEstimatedValue: 32000,
      },
      playerCharacter: makeContext().playerCharacter,
      playerStocks: makeContext().playerStocks,
      playerProperties: makeContext().playerProperties,
      availableStocks: makeContext().availableStocks,
    });

    expect(error).toBe('PROPERTY_ONLY_IN_DREAM_HELPER');
  });

  it('calculates target player value from benefit percent', () => {
    expect(calcTargetPlayerValue(45000, 10)).toBe(40909);
    expect(calcTargetPlayerValue(10000, -15)).toBe(11765);
  });
});

describe('deal builder', () => {
  const purposes: DealPurpose[] = ['VALUE_EXCHANGE', 'LIQUIDITY', 'DREAM_HELPER'];

  it.each(purposes)('builds %s deals with valid economics', (purpose) => {
    for (let i = 0; i < 25; i++) {
      const ctx = makeContext();
      const built = buildDeal(ctx, purpose);
      if (!built) continue;

      const payRatio = built.playerGives.totalEstimatedValue / built.botGives.totalEstimatedValue;
      expect(payRatio).toBeGreaterThanOrEqual(PURPOSE_MIN_PAY_RATIO[purpose] - 0.05);

      const validationError = validateDeal({
        purpose: built.purpose,
        botGives: built.botGives,
        playerGives: built.playerGives,
        playerCharacter: ctx.playerCharacter,
        playerStocks: ctx.playerStocks,
        playerProperties: ctx.playerProperties,
        availableStocks: ctx.availableStocks,
      });
      expect(validationError).toBeNull();
    }
  });

  it('does not offer unaffordable tractor to low-balance player', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 4000,
      } as DealBuildContext['playerCharacter'],
      playerStocks: [],
      playerProperties: [],
    });

    for (let i = 0; i < 20; i++) {
      const built = buildDeal(ctx, 'DREAM_HELPER');
      if (!built) continue;
      expect(built.botGives.assets.some((a) => a.propertyId === 'tractor' && a.estimatedValue === 45000))
        .toBe(false);
    }
  });
});

describe('DealGenerator', () => {
  it('returns validated offers only', async () => {
    const generator = new DealGenerator();
    const ctx = makeContext();

    for (let i = 0; i < 25; i++) {
      const offer = await generator.maybeGenerate({
        gameId: ctx.gameId,
        gameStep: ctx.gameStep,
        playerCharacter: ctx.playerCharacter,
        npcCharacter: ctx.npcCharacter,
        availableStocks: ctx.availableStocks,
        playerStocks: ctx.playerStocks,
        playerProperties: ctx.playerProperties,
      });

      if (!offer) continue;

      const payRatio = offer.playerGives.totalEstimatedValue / offer.botGives.totalEstimatedValue;
      expect(payRatio).toBeGreaterThanOrEqual(0.75);
      expect(offer.playerBenefitPercent).toBeLessThanOrEqual(25);
      expect(['VALUE_EXCHANGE', 'LIQUIDITY', 'DREAM_HELPER']).toContain(offer.purpose);
    }
  });
});
