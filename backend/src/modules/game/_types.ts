import type { Character, Game, InventoryItem } from '@prisma/client';
import type {
  GeneratedOtcDeal,
  GeneratedPropertyOffer,
  PersistedNewsItem,
} from '../news/types.js';
import type { CharacterDto } from '../../schemas/character.schema.js';
import type { CharacterSkillsState } from '../../schemas/character_skills.schema.js';
import type { PassiveResult, TurnForecast } from './_passive_income.service.js';
import type { AppliedPriceImpact } from '../market/price_impact.service.js';
import { calcInsiderChance } from '../character_skills/_calculations.js';

export type CharacterWithInventory = Character & { inventoryItems: InventoryItem[] };

export type GameWithCharacter = Game & {
  character: CharacterWithInventory;
};

/** Контекст хода — загружается один раз и обновляется фазами */
export interface TurnContext {
  userId: string;
  gameId: string;
  game: GameWithCharacter;
  playerPortfolioTickers: string[];
}

/** Накопитель результатов всех фаз */
export interface TurnState {
  passiveIncome?: PassiveResult;
  insiderChancePercent: number;
  insiderRolled: boolean;
  news: PersistedNewsItem[];
  otcDeal?: GeneratedOtcDeal;
  propertyOffer?: GeneratedPropertyOffer;
  appliedPriceImpacts?: AppliedPriceImpact[];
}

export function createInitialTurnState(professionLevel: number): TurnState {
  return {
    insiderChancePercent: calcInsiderChance(professionLevel),
    insiderRolled: false,
    news: [],
  };
}

export interface EndTurnResult {
  step: number;
  balance: number;
  character: CharacterDto;
  nextTurnForecast: TurnForecast;
  passiveIncome: PassiveResult;
  insiderChancePercent: number;
  insiderRolled: boolean;
  news: PersistedNewsItem[];
  otcDeal?: GeneratedOtcDeal;
  propertyOffer?: GeneratedPropertyOffer;
  appliedPriceImpacts?: AppliedPriceImpact[];
  characterSkills: CharacterSkillsState;
}

export interface TurnPhase {
  readonly id: string;
  execute(context: TurnContext, state: TurnState): Promise<void>;
}
