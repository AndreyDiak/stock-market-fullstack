import { Profession } from '@prisma/client';
import { buildDeal, buildDealWithRetries, listAvailablePurposes } from '../src/modules/deals/deal.builder.js';
import type { DealBuildContext } from '../src/modules/deals/deal.builder.js';
import { DealGenerator } from '../src/modules/deals/deal.generator.js';
import { validateDeal } from '../src/modules/deals/deal.validator.js';

function makeCtx(overrides: Partial<DealBuildContext> = {}): DealBuildContext {
  return {
    gameId: 'debug-game',
    gameStep: 3,
    playerCharacter: {
      id: 'p1',
      balance: 12_000,
      reputation: 3,
      tradingLevel: 1,
      profession: Profession.FARMER,
      dreamItemRefs: ['tractor', 'garage'],
      name: 'Игрок',
      inventoryItems: [
        {
          id: 'inv1',
          itemRef: 'old_garage',
          name: 'Старый гараж',
          purchasePrice: 2250,
          isInstallment: true,
          monthlyPayment: 79,
          installmentsTotal: 20,
          installmentsPaid: 1,
          isPaidOff: false,
          characterId: 'p1',
          purchasedAt: new Date(),
          special: null,
        },
      ],
    } as DealBuildContext['playerCharacter'],
    npcCharacter: {
      id: 'n1',
      name: 'Иваныч',
      profession: Profession.FARMER,
      tradingLevel: 1,
      reputation: 4,
    } as DealBuildContext['npcCharacter'],
    availableStocks: [
      {
        id: 'listing-1',
        gameId: 'debug-game',
        companyId: 'c1',
        currentPrice: 12,
        availableOnExchange: true,
        grade: 'F',
        company: { ticker: 'COIN' },
      },
      {
        id: 'listing-2',
        gameId: 'debug-game',
        companyId: 'c2',
        currentPrice: 85,
        availableOnExchange: true,
        grade: 'E',
        company: { ticker: 'LEND' },
      },
    ] as DealBuildContext['availableStocks'],
    playerStocks: [],
    playerProperties: [{ propertyId: 'old_garage', propertyName: 'Старый гараж', estimatedValue: 2250 }],
    ...overrides,
  };
}

async function main() {
  const ctx = makeCtx();
  console.log('Available purposes:', listAvailablePurposes(ctx));

  const purposes = ['DREAM_HELPER', 'STOCK_PACKAGE', 'LIQUIDITY', 'VALUE_EXCHANGE'] as const;
  for (const purpose of purposes) {
    let built = 0;
    let validated = 0;
    const errors = new Map<string, number>();

    for (let i = 0; i < 100; i++) {
      const deal = buildDeal(ctx, purpose);
      if (!deal) continue;
      built++;
      const err = validateDeal({
        purpose: deal.purpose,
        botGives: deal.botGives,
        playerGives: deal.playerGives,
        playerCharacter: ctx.playerCharacter,
        playerStocks: ctx.playerStocks,
        playerProperties: ctx.playerProperties,
        availableStocks: ctx.availableStocks,
      });
      if (!err) validated++;
      else errors.set(err, (errors.get(err) ?? 0) + 1);
    }

    console.log(`\n${purpose}: built=${built}/100 validated=${validated}/100`);
    if (errors.size > 0) console.log('  errors:', Object.fromEntries(errors));
  }

  let retries = 0;
  for (let i = 0; i < 100; i++) {
    if (buildDealWithRetries(ctx, 12)) retries++;
  }
  console.log(`\nbuildDealWithRetries(12): ${retries}/100`);

  let gen = 0;
  const generator = new DealGenerator();
  for (let i = 0; i < 50; i++) {
    const offer = await generator.maybeGenerate({
      gameId: ctx.gameId,
      gameStep: ctx.gameStep,
      playerCharacter: ctx.playerCharacter,
      npcCharacter: ctx.npcCharacter,
      availableStocks: ctx.availableStocks,
      playerStocks: ctx.playerStocks,
      playerProperties: ctx.playerProperties,
    });
    if (offer) gen++;
  }
  console.log(`DealGenerator.maybeGenerate: ${gen}/50`);

  const noStocks = makeCtx({ availableStocks: [] as DealBuildContext['availableStocks'] });
  console.log('\n--- No exchange stocks ---');
  console.log('purposes:', listAvailablePurposes(noStocks));
  let r1 = 0;
  for (let i = 0; i < 50; i++) if (buildDealWithRetries(noStocks, 12)) r1++;
  console.log(`retries: ${r1}/50`);

  const noDream = makeCtx({
    playerCharacter: {
      ...makeCtx().playerCharacter,
      balance: 5000,
      dreamItemRefs: ['tractor'],
    } as DealBuildContext['playerCharacter'],
    playerProperties: [],
  });
  console.log('\n--- Tractor dream, low balance ---');
  console.log('purposes:', listAvailablePurposes(noDream));
  let r2 = 0;
  for (let i = 0; i < 50; i++) if (buildDealWithRetries(noDream, 12)) r2++;
  console.log(`retries: ${r2}/50`);

  const tl1OnlyF = makeCtx({
    availableStocks: [
      {
        id: 'listing-2',
        gameId: 'debug-game',
        companyId: 'c2',
        currentPrice: 85,
        availableOnExchange: true,
        grade: 'E',
        company: { ticker: 'LEND' },
      },
    ] as DealBuildContext['availableStocks'],
    playerCharacter: {
      ...makeCtx().playerCharacter,
      balance: 5000,
      tradingLevel: 1,
      dreamItemRefs: ['tractor'],
    } as DealBuildContext['playerCharacter'],
    playerProperties: [],
  });
  console.log('\n--- TL1, only E stocks, tractor dream ---');
  console.log('purposes:', listAvailablePurposes(tl1OnlyF));
  let r3 = 0;
  for (let i = 0; i < 50; i++) if (buildDealWithRetries(tl1OnlyF, 12)) r3++;
  console.log(`retries: ${r3}/50`);
}

main().catch(console.error);
