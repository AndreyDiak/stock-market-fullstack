import type { Character, GameStockListing, InventoryItem } from '@prisma/client';
import { buildDealWithRetries, buildGuaranteedDeal } from './deal.builder.js';
import type { GeneratedDealOffer } from './deal.types.js';
import type { PlayerPropertyRef, PlayerStockRef } from './deal.types.js';
import type { BuiltDeal } from './deal.builder.js';
import {
  maxStockRequiredTradingLevel,
  validateDealForGeneration,
} from './deal.validator.js';

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

interface GameStockListingWithCompany extends GameStockListing {
  company: { ticker: string };
}

export interface DealGenContext {
  gameId: string;
  gameStep: number;
  playerCharacter: Character & { inventoryItems?: InventoryItem[] };
  npcCharacter: Character;
  availableStocks: GameStockListingWithCompany[];
  playerStocks: PlayerStockRef[];
  playerProperties: PlayerPropertyRef[];
}

function getRequiredTradingLevel(
  purpose: GeneratedDealOffer['purpose'],
  botGives: GeneratedDealOffer['botGives'],
  availableStocks: GameStockListingWithCompany[],
): number {
  switch (purpose) {
    case 'DREAM_HELPER':
    case 'LIQUIDITY':
    case 'VALUE_EXCHANGE':
      return 1;
    case 'STOCK_PACKAGE':
      return maxStockRequiredTradingLevel(botGives, availableStocks);
    default:
      return 1;
  }
}

export class DealGenerator {
  async maybeGenerate(input: {
    gameId: string;
    gameStep: number;
    playerCharacter: Character & { inventoryItems?: InventoryItem[] };
    npcCharacter: Character;
    availableStocks: GameStockListingWithCompany[];
    playerStocks: Array<{ ticker: string; shares: number; listingId: string }>;
    playerProperties?: PlayerPropertyRef[];
  }): Promise<GeneratedDealOffer> {
    const stockPriceByTicker = new Map(
      input.availableStocks.map((listing) => [listing.company.ticker, listing.currentPrice]),
    );

    const ctx: DealGenContext = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      playerCharacter: input.playerCharacter,
      npcCharacter: input.npcCharacter,
      availableStocks: input.availableStocks,
      playerStocks: input.playerStocks.map((stock) => ({
        ...stock,
        currentPrice: stockPriceByTicker.get(stock.ticker) ?? 0,
      })),
      playerProperties: input.playerProperties ?? [],
    };

    let built: BuiltDeal | null = null;

    for (let attempt = 0; attempt < 24; attempt++) {
      const candidate = buildDealWithRetries(ctx, 8);
      if (!candidate) continue;

      const validationError = validateDealForGeneration({
        purpose: candidate.purpose,
        botGives: candidate.botGives,
        playerGives: candidate.playerGives,
        playerCharacter: ctx.playerCharacter,
        playerStocks: ctx.playerStocks,
        playerProperties: ctx.playerProperties,
        availableStocks: ctx.availableStocks,
      });

      if (validationError) continue;
      built = candidate;
      break;
    }

    if (!built) {
      built = buildGuaranteedDeal(ctx);
    }

    const shapeError = validateDealForGeneration({
      purpose: built.purpose,
      botGives: built.botGives,
      playerGives: built.playerGives,
      playerCharacter: ctx.playerCharacter,
      playerStocks: ctx.playerStocks,
      playerProperties: ctx.playerProperties,
      availableStocks: ctx.availableStocks,
    });
    if (shapeError) {
      built = buildGuaranteedDeal(ctx);
    }

    return this.#finalizeDeal(ctx, built.purpose, built.botGives, built.playerGives);
  }

  #finalizeDeal(
    ctx: DealGenContext,
    purpose: GeneratedDealOffer['purpose'],
    botGives: GeneratedDealOffer['botGives'],
    playerGives: GeneratedDealOffer['playerGives'],
  ): GeneratedDealOffer {
    const benefitValue = botGives.totalEstimatedValue - playerGives.totalEstimatedValue;
    const benefitPercent = playerGives.totalEstimatedValue === 0
      ? 100
      : Math.round((benefitValue / playerGives.totalEstimatedValue) * 100);

    const dreamProperty = purpose === 'DREAM_HELPER' ? botGives.assets[0] : null;
    const propertyBonus = dreamProperty && dreamProperty.estimatedValue > 20_000
      ? (1 + Math.random() * 2)
      : 0;
    const benefitClamped = Math.max(-100, Math.min(100, benefitPercent));
    const benefitFactor = Math.max(0, benefitClamped / 25);
    const baseReq = purpose === 'LIQUIDITY'
      ? 1 + Math.random() * 1.5
      : 1 + Math.random() * 3;
    const rawReq = baseReq + benefitFactor + propertyBonus;
    const reqRep = clamp(Math.round(rawReq * 10) / 10, 1, 10);

    const reqTrading = getRequiredTradingLevel(purpose, botGives, ctx.availableStocks);
    const repPenalty = benefitPercent < -20 ? 2.0 : benefitPercent < 0 ? 1.0 : 0.5;

    const expiresInTurns = 2 + randomInt(0, 2);

    return {
      id: crypto.randomUUID(),
      purpose,
      botCharacterId: ctx.npcCharacter.id,
      botName: ctx.npcCharacter.name,
      botProfession: ctx.npcCharacter.profession,
      botGives,
      playerGives,
      requiredReputation: reqRep,
      requiredTradingLevel: reqTrading,
      reputationPenalty: repPenalty,
      playerBenefitValue: benefitValue,
      playerBenefitPercent: benefitPercent,
      status: 'ACTIVE',
      turnCreated: ctx.gameStep,
      expiresTurn: ctx.gameStep + expiresInTurns,
      expiresInTurns,
    };
  }
}
