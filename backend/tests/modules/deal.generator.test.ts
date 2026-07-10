import { describe, expect, it } from 'vitest';
import { Profession } from '@prisma/client';
import { buildDeal, buildGuaranteedDeal, listAvailablePurposes } from '../../src/modules/deals/deal.builder.js';
import type { DealBuildContext } from '../../src/modules/deals/deal.builder.js';
import { DealGenerator } from '../../src/modules/deals/deal.generator.js';
import type { DealPurpose } from '../../src/modules/deals/deal.types.js';
import {
  PURPOSE_FAIRNESS,
  PURPOSE_MIN_PAY_RATIO,
  calcTargetPlayerValue,
  validateDeal,
  validateDealForGeneration,
} from '../../src/modules/deals/deal.validator.js';

function makeContext(overrides: Partial<DealBuildContext> = {}): DealBuildContext {
  return {
    gameId: 'game-1',
    gameStep: 5,
    playerCharacter: {
      id: 'player-1',
      balance: 25_000,
      reputation: 5,
      tradingLevel: 3,
      profession: Profession.FARMER,
      dreamItemRefs: ['parking_spot'],
      name: 'Игрок',
      inventoryItems: [],
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
        grade: 'E',
        company: { ticker: 'LEND' },
      },
      {
        id: 'listing-tech',
        gameId: 'game-1',
        companyId: 'company-tech',
        currentPrice: 420,
        availableOnExchange: true,
        grade: 'D',
        company: { ticker: 'TECH' },
      },
    ] as DealBuildContext['availableStocks'],
    playerStocks: [
      { ticker: 'LEND', shares: 80, listingId: 'listing-lend', currentPrice: 180 },
    ],
    playerProperties: [],
    ...overrides,
  };
}

function assertValidDeal(ctx: DealBuildContext, purpose: DealPurpose) {
  for (let i = 0; i < 30; i++) {
    const built = buildDeal(ctx, purpose);
    if (!built) continue;

    expect(built.purpose).toBe(purpose);
    if (purpose !== 'DREAM_HELPER') {
      expect(built.playerGives.assets.every((asset) => asset.type !== 'PROPERTY')).toBe(true);
    } else {
      expect(built.playerGives.assets.some((asset) => asset.type === 'CASH')).toBe(true);
      expect(built.playerGives.assets.some((asset) => asset.type === 'STOCK')).toBe(true);
    }

    const validationError = validateDealForGeneration({
      purpose: built.purpose,
      botGives: built.botGives,
      playerGives: built.playerGives,
      playerCharacter: ctx.playerCharacter,
      playerStocks: ctx.playerStocks,
      playerProperties: ctx.playerProperties,
      availableStocks: ctx.availableStocks,
    });
    expect(validationError).toBeNull();

    const benefitPercent = Math.round(
      ((built.botGives.totalEstimatedValue - built.playerGives.totalEstimatedValue)
        / built.playerGives.totalEstimatedValue) * 100,
    );
    const fairness = PURPOSE_FAIRNESS[purpose];
    expect(benefitPercent).toBeGreaterThanOrEqual(fairness.minBenefitPercent - 1);
    expect(benefitPercent).toBeLessThanOrEqual(fairness.maxBenefitPercent + 1);

    return built;
  }

  return null;
}

describe('deal validator', () => {
  it('rejects deals where player pays far less than bot gives', () => {
    const error = validateDeal({
      purpose: 'DREAM_HELPER',
      botGives: {
        assets: [{ type: 'PROPERTY', propertyId: 'tractor', propertyName: 'Трактор', estimatedValue: 45_000 }],
        totalEstimatedValue: 45_000,
      },
      playerGives: {
        assets: [
          { type: 'CASH', cashAmount: 2_000, estimatedValue: 2_000 },
          { type: 'STOCK', ticker: 'LEND', shares: 10, estimatedValue: 1_800 },
        ],
        totalEstimatedValue: 3_800,
      },
      playerCharacter: makeContext().playerCharacter,
      playerStocks: makeContext().playerStocks,
      playerProperties: makeContext().playerProperties,
      availableStocks: makeContext().availableStocks,
    });

    expect(error).toMatch(/PLAYER_PAYS_TOO_LITTLE|GLOBAL_BENEFIT_OUT_OF_RANGE|PURPOSE_BENEFIT_OUT_OF_RANGE/);
  });

  it('accepts dream helper with cash and stock composite bundle', () => {
    const error = validateDealForGeneration({
      purpose: 'DREAM_HELPER',
      botGives: {
        assets: [{ type: 'PROPERTY', propertyId: 'tractor', propertyName: 'Трактор', estimatedValue: 45_000 }],
        totalEstimatedValue: 45_000,
      },
      playerGives: {
        assets: [
          { type: 'CASH', cashAmount: 20_000, estimatedValue: 20_000 },
          { type: 'STOCK', ticker: 'LEND', shares: 120, estimatedValue: 21_600 },
        ],
        totalEstimatedValue: 41_600,
      },
      playerCharacter: makeContext().playerCharacter,
      playerStocks: makeContext().playerStocks,
      playerProperties: makeContext().playerProperties,
      availableStocks: makeContext().availableStocks,
    });

    expect(error).toBeNull();
  });

  it('rejects dream helper without stock in player bundle', () => {
    const error = validateDealForGeneration({
      purpose: 'DREAM_HELPER',
      botGives: {
        assets: [{ type: 'PROPERTY', propertyId: 'tractor', propertyName: 'Трактор', estimatedValue: 12_000 }],
        totalEstimatedValue: 12_000,
      },
      playerGives: {
        assets: [{ type: 'CASH', cashAmount: 11_000, estimatedValue: 11_000 }],
        totalEstimatedValue: 11_000,
      },
      playerCharacter: makeContext().playerCharacter,
      playerStocks: makeContext().playerStocks,
      playerProperties: makeContext().playerProperties,
      availableStocks: makeContext().availableStocks,
    });

    expect(error).toBe('DREAM_PLAYER_MUST_GIVE_STOCK');
  });

  it('rejects liquidity when player does not own offered stocks', () => {
    const error = validateDeal({
      purpose: 'LIQUIDITY',
      botGives: {
        assets: [{ type: 'CASH', cashAmount: 8_000, estimatedValue: 8_000 }],
        totalEstimatedValue: 8_000,
      },
      playerGives: {
        assets: [{ type: 'STOCK', ticker: 'TECH', shares: 20, estimatedValue: 8_400 }],
        totalEstimatedValue: 8_400,
      },
      playerCharacter: makeContext().playerCharacter,
      playerStocks: makeContext().playerStocks,
      playerProperties: makeContext().playerProperties,
      availableStocks: makeContext().availableStocks,
    });

    expect(error).toBe('INSUFFICIENT_STOCK');
  });

  it('calculates target player value from benefit percent', () => {
    expect(calcTargetPlayerValue(45_000, 10)).toBe(40_909);
    expect(calcTargetPlayerValue(10_000, -15)).toBe(11_765);
  });
});

describe('buildGuaranteedDeal', () => {
  it('always builds a dream helper offer', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 100,
        dreamItemRefs: ['tractor'],
      } as DealBuildContext['playerCharacter'],
      playerStocks: [],
      playerProperties: [],
      availableStocks: [
        {
          id: 'listing-f',
          gameId: 'game-1',
          companyId: 'company-f',
          currentPrice: 50,
          availableOnExchange: true,
          grade: 'F',
          company: { ticker: 'COIN' },
        },
      ] as DealBuildContext['availableStocks'],
    });

    const built = buildGuaranteedDeal(ctx);
    expect(built.purpose).toBe('DREAM_HELPER');
    expect(validateDealForGeneration({
      purpose: built.purpose,
      botGives: built.botGives,
      playerGives: built.playerGives,
      playerCharacter: ctx.playerCharacter,
      playerStocks: ctx.playerStocks,
      playerProperties: ctx.playerProperties,
      availableStocks: ctx.availableStocks,
    })).toBeNull();
  });

  it('validates for every profession in worst-case state', () => {
    const professions = [
      Profession.FARMER,
      Profession.ENGINEER,
      Profession.DEVELOPER,
      Profession.FINANCIER,
      Profession.DOCTOR,
      Profession.STREET_CLEANER,
    ] as const;

    for (const profession of professions) {
      const ctx = makeContext({
        playerCharacter: {
          ...makeContext().playerCharacter,
          balance: 500,
          tradingLevel: 1,
          profession,
          dreamItemRefs: [],
        } as DealBuildContext['playerCharacter'],
        playerStocks: [],
        playerProperties: [],
        availableStocks: [
          {
            id: 'listing-f',
            gameId: 'game-1',
            companyId: 'company-f',
            currentPrice: 50,
            availableOnExchange: true,
            grade: 'F',
            company: { ticker: 'COIN' },
          },
        ] as DealBuildContext['availableStocks'],
      });

      const built = buildGuaranteedDeal(ctx);
      expect(validateDealForGeneration({
        purpose: built.purpose,
        botGives: built.botGives,
        playerGives: built.playerGives,
        playerCharacter: ctx.playerCharacter,
        playerStocks: ctx.playerStocks,
        playerProperties: ctx.playerProperties,
        availableStocks: ctx.availableStocks,
      })).toBeNull();
    }
  });
});

describe('deal builder', () => {
  it('builds DREAM_HELPER with cash, stock and optional property bundle', () => {
    const built = assertValidDeal(makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        dreamItemRefs: ['combine_harvester'],
      } as DealBuildContext['playerCharacter'],
      playerProperties: [{ propertyId: 'tractor', propertyName: 'Трактор', estimatedValue: 45_000 }],
    }), 'DREAM_HELPER');
    expect(built).not.toBeNull();
    expect(built!.botGives.assets).toHaveLength(1);
    expect(built!.botGives.assets[0]?.type).toBe('PROPERTY');
    expect(built!.playerGives.assets.some((asset) => asset.type === 'CASH')).toBe(true);
    expect(built!.playerGives.assets.some((asset) => asset.type === 'STOCK')).toBe(true);
    expect(built!.playerGives.assets.filter((asset) => asset.type === 'PROPERTY').length).toBeLessThanOrEqual(1);
  });

  it('builds STOCK_PACKAGE with stock bot bundle and cash player bundle', () => {
    const built = assertValidDeal(makeContext(), 'STOCK_PACKAGE');
    expect(built).not.toBeNull();
    expect(built!.botGives.assets.every((asset) => asset.type === 'STOCK')).toBe(true);
    expect(built!.playerGives.assets.every((asset) => asset.type === 'CASH')).toBe(true);
  });

  it('builds STOCK_PACKAGE for empty portfolio even with low balance and high-grade stocks', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 1_500,
        tradingLevel: 1,
      } as DealBuildContext['playerCharacter'],
      playerStocks: [],
      availableStocks: [
        {
          id: 'listing-e',
          gameId: 'game-1',
          companyId: 'company-e',
          currentPrice: 85,
          availableOnExchange: true,
          grade: 'E',
          company: { ticker: 'LEND' },
        },
      ] as DealBuildContext['availableStocks'],
    });

    let foundStockPackage = false;
    for (let i = 0; i < 30; i++) {
      const built = buildDeal(ctx, 'STOCK_PACKAGE');
      if (!built) continue;
      foundStockPackage = true;
      expect(built.botGives.assets.every((asset) => asset.type === 'STOCK')).toBe(true);
      expect(built.playerGives.assets.every((asset) => asset.type === 'CASH')).toBe(true);
    }

    expect(foundStockPackage).toBe(true);
    expect(listAvailablePurposes(ctx).some((entry) => entry.purpose === 'STOCK_PACKAGE')).toBe(true);
  });

  it('guaranteed deal offers dream property when player has no real estate', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 800,
        tradingLevel: 1,
        dreamItemRefs: ['tractor'],
      } as DealBuildContext['playerCharacter'],
      playerStocks: [],
      playerProperties: [],
      availableStocks: [
        {
          id: 'listing-e',
          gameId: 'game-1',
          companyId: 'company-e',
          currentPrice: 120,
          availableOnExchange: true,
          grade: 'E',
          company: { ticker: 'LEND' },
        },
      ] as DealBuildContext['availableStocks'],
    });

    const built = buildGuaranteedDeal(ctx);
    expect(built.purpose).toBe('DREAM_HELPER');
    expect(built.botGives.assets.every((asset) => asset.type === 'PROPERTY')).toBe(true);
    expect(validateDealForGeneration({
      purpose: built.purpose,
      botGives: built.botGives,
      playerGives: built.playerGives,
      playerCharacter: ctx.playerCharacter,
      playerStocks: ctx.playerStocks,
      playerProperties: ctx.playerProperties,
      availableStocks: ctx.availableStocks,
    })).toBeNull();
  });

  it('builds DREAM_HELPER for player with no real estate and low balance', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 1_500,
        dreamItemRefs: ['tractor'],
      } as DealBuildContext['playerCharacter'],
      playerStocks: [],
      playerProperties: [],
      availableStocks: [
        {
          id: 'listing-f',
          gameId: 'game-1',
          companyId: 'company-f',
          currentPrice: 50,
          availableOnExchange: true,
          grade: 'F',
          company: { ticker: 'COIN' },
        },
      ] as DealBuildContext['availableStocks'],
    });

    let foundTractor = false;
    for (let i = 0; i < 30; i++) {
      const built = buildDeal(ctx, 'DREAM_HELPER');
      if (!built) continue;
      if (built.botGives.assets.some((asset) => asset.propertyId === 'tractor')) {
        foundTractor = true;
        const cash = built.playerGives.assets.find((asset) => asset.type === 'CASH');
        expect((cash?.cashAmount ?? 0)).toBeGreaterThan(ctx.playerCharacter.balance);
      }
    }

    expect(foundTractor).toBe(true);
    expect(listAvailablePurposes(ctx).find((entry) => entry.purpose === 'DREAM_HELPER')?.weight).toBe(4);
  });

  it('builds LIQUIDITY only from owned portfolio stocks', () => {
    const built = assertValidDeal(makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 4_000,
      } as DealBuildContext['playerCharacter'],
    }), 'LIQUIDITY');

    expect(built).not.toBeNull();
    expect(built!.botGives.assets.every((asset) => asset.type === 'CASH')).toBe(true);
    expect(built!.playerGives.assets.every((asset) => asset.type === 'STOCK')).toBe(true);
    for (const asset of built!.playerGives.assets) {
      const owned = makeContext().playerStocks.find((stock) => stock.ticker === asset.ticker);
      expect(owned).toBeTruthy();
      expect((owned?.shares ?? 0) >= (asset.shares ?? 0)).toBe(true);
    }
  });

  it('can offer aspirational tractor deal to low-balance player', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 4_000,
        dreamItemRefs: ['tractor'],
      } as DealBuildContext['playerCharacter'],
      playerStocks: [],
      playerProperties: [],
    });

    let foundTractor = false;
    for (let i = 0; i < 50; i++) {
      const built = buildDeal(ctx, 'DREAM_HELPER');
      if (!built) continue;
      if (built.botGives.assets.some((asset) => asset.propertyId === 'tractor')) {
        foundTractor = true;
        expect(built.playerGives.assets.some((asset) => asset.type === 'CASH')).toBe(true);
        expect(built.playerGives.assets.some((asset) => asset.type === 'STOCK')).toBe(true);
      }
    }
    expect(foundTractor).toBe(true);
  });

  it('includes cheaper property in dream helper bundle for business upgrade', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        profession: Profession.STREET_CLEANER,
        dreamItemRefs: ['car_wash'],
      } as DealBuildContext['playerCharacter'],
      playerProperties: [],
    });

    let found = false;
    for (let i = 0; i < 25; i++) {
      const built = buildDeal({
        ...ctx,
        playerCharacter: {
          ...ctx.playerCharacter,
          dreamItemRefs: ['car_wash'],
        } as DealBuildContext['playerCharacter'],
      }, 'DREAM_HELPER');
      if (!built) continue;
      if (built.botGives.assets.some((asset) => asset.propertyId === 'car_wash')) {
        const playerProperty = built.playerGives.assets.find((asset) => asset.type === 'PROPERTY');
        expect(playerProperty?.propertyId).toBe('trade_pavilion');
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('can request player-owned cheaper property as trade-in', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        dreamItemRefs: ['sport_car'],
      } as DealBuildContext['playerCharacter'],
      playerProperties: [{ propertyId: 'car', propertyName: 'Автомобиль', estimatedValue: 35_000 }],
    });

    let found = false;
    for (let i = 0; i < 25; i++) {
      const built = buildDeal(ctx, 'DREAM_HELPER');
      if (!built) continue;
      if (built.botGives.assets.some((asset) => asset.propertyId === 'sport_car')) {
        expect(built.playerGives.assets.some((asset) => asset.type === 'PROPERTY' && asset.propertyId === 'car')).toBe(true);
        found = true;
        break;
      }
    }
    expect(found).toBe(true);
  });

  it('offers only luxury dream targets such as penthouse, not regular property', () => {
    const ctx = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        profession: Profession.DOCTOR,
        dreamItemRefs: ['penthouse', 'apartment'],
      } as DealBuildContext['playerCharacter'],
      playerProperties: [],
    });

    let foundPenthouse = false;
    for (let i = 0; i < 30; i++) {
      const built = buildDeal(ctx, 'DREAM_HELPER');
      if (!built) continue;
      const botProperty = built.botGives.assets.find((asset) => asset.type === 'PROPERTY');
      if (!botProperty) continue;
      expect(botProperty.propertyId).not.toBe('apartment');
      if (botProperty.propertyId === 'penthouse') {
        foundPenthouse = true;
      }
    }
    expect(foundPenthouse).toBe(true);
  });

  it('does not include LIQUIDITY when cash buffer is healthy', () => {
    const purposes = listAvailablePurposes(makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 50_000,
      } as DealBuildContext['playerCharacter'],
    }));

    expect(purposes.some((entry) => entry.purpose === 'LIQUIDITY')).toBe(false);
    expect(purposes.some((entry) => entry.purpose === 'DREAM_HELPER')).toBe(true);
    expect(purposes.some((entry) => entry.purpose === 'STOCK_PACKAGE')).toBe(true);
  });
});

describe('DealGenerator', () => {
  it('always returns an offer', async () => {
    const generator = new DealGenerator();
    const worstCase = makeContext({
      playerCharacter: {
        ...makeContext().playerCharacter,
        balance: 500,
        tradingLevel: 1,
        dreamItemRefs: ['tractor'],
      } as DealBuildContext['playerCharacter'],
      availableStocks: [
        {
          id: 'listing-e',
          gameId: 'game-1',
          companyId: 'company-e',
          currentPrice: 85,
          availableOnExchange: true,
          grade: 'E',
          company: { ticker: 'LEND' },
        },
      ] as DealBuildContext['availableStocks'],
      playerStocks: [],
      playerProperties: [],
    });

    for (let i = 0; i < 30; i++) {
      const offer = await generator.maybeGenerate({
        gameId: worstCase.gameId,
        gameStep: worstCase.gameStep,
        playerCharacter: worstCase.playerCharacter,
        npcCharacter: worstCase.npcCharacter,
        availableStocks: worstCase.availableStocks,
        playerStocks: worstCase.playerStocks,
        playerProperties: worstCase.playerProperties,
      });

      expect(offer).toBeTruthy();
      expect(offer.botGives.assets.length).toBeGreaterThan(0);
      expect(offer.playerGives.assets.length).toBeGreaterThan(0);
    }
  });

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

      const payRatio = offer.playerGives.totalEstimatedValue / offer.botGives.totalEstimatedValue;
      expect(payRatio).toBeGreaterThanOrEqual(PURPOSE_MIN_PAY_RATIO[offer.purpose] - 0.1);
      expect(offer.playerBenefitPercent).toBeLessThanOrEqual(25);
      expect(['VALUE_EXCHANGE', 'LIQUIDITY', 'DREAM_HELPER', 'STOCK_PACKAGE']).toContain(offer.purpose);

      if (offer.purpose === 'DREAM_HELPER') {
        expect(offer.playerGives.assets.some((asset) => asset.type === 'CASH')).toBe(true);
        expect(offer.playerGives.assets.some((asset) => asset.type === 'STOCK')).toBe(true);
      }
      if (offer.purpose === 'STOCK_PACKAGE') {
        expect(offer.botGives.assets.every((asset) => asset.type === 'STOCK')).toBe(true);
      }
    }
  });
});
