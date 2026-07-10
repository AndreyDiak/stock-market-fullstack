import type { Character, GameStockListing } from '@prisma/client';
import { buildDealWithRetries } from './deal.builder.js';
import type { GeneratedDealOffer } from './deal.types.js';
import type { PlayerPropertyRef, PlayerStockRef } from './deal.types.js';
import { validateDeal } from './deal.validator.js';

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
  playerCharacter: Character;
  npcCharacter: Character;
  availableStocks: GameStockListingWithCompany[];
  playerStocks: PlayerStockRef[];
  playerProperties: PlayerPropertyRef[];
}

export class DealGenerator {
  async maybeGenerate(input: {
    gameId: string;
    gameStep: number;
    playerCharacter: Character;
    npcCharacter: Character;
    availableStocks: GameStockListingWithCompany[];
    playerStocks: Array<{ ticker: string; shares: number; listingId: string }>;
    playerProperties?: PlayerPropertyRef[];
  }): Promise<GeneratedDealOffer | null> {
    const stockPriceByTicker = new Map(
      input.availableStocks.map((s) => [s.company.ticker, s.currentPrice]),
    );

    const ctx: DealGenContext = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      playerCharacter: input.playerCharacter,
      npcCharacter: input.npcCharacter,
      availableStocks: input.availableStocks,
      playerStocks: input.playerStocks.map((s) => ({
        ...s,
        currentPrice: stockPriceByTicker.get(s.ticker) ?? 0,
      })),
      playerProperties: input.playerProperties ?? [],
    };

    for (let attempt = 0; attempt < 16; attempt++) {
      const built = buildDealWithRetries(ctx, 1);
      if (!built) continue;

      const validationError = validateDeal({
        purpose: built.purpose,
        botGives: built.botGives,
        playerGives: built.playerGives,
        playerCharacter: ctx.playerCharacter,
        playerStocks: ctx.playerStocks,
        playerProperties: ctx.playerProperties,
        availableStocks: ctx.availableStocks,
      });

      if (validationError) continue;

      return this.#finalizeDeal(ctx, built.purpose, built.botGives, built.playerGives);
    }

    return null;
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

    const hasDreamProperty = purpose === 'DREAM_HELPER';
    const propertyBonus = hasDreamProperty ? (1 + Math.random() * 2) : 0;
    const benefitClamped = Math.max(-100, Math.min(100, benefitPercent));
    const benefitFactor = Math.max(0, benefitClamped / 25);
    const baseReq = 1 + Math.random() * 3;
    const rawReq = baseReq + benefitFactor + propertyBonus;
    const reqRep = clamp(Math.round(rawReq * 10) / 10, 1, 10);

    const reqTrading = clamp(ctx.npcCharacter.tradingLevel, 1, 6);
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
