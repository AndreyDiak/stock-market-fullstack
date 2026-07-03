import type { PrismaClient } from '@prisma/client';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { PropertyOffersService } from '../property_offers/property_offers.service.js';
import { OtcDealsService } from '../otc_deals/otc_deals.service.js';
import { AppError } from '../../utils/errors.js';
import { CharacterSkillsService } from '../character_skills/character_skills.service.js';
import { serializeCharacter, serializeGame } from '../saves/game_serializer.js';
import { SavesService } from '../saves/saves.service.js';
import { PassiveIncomeService } from './_passive_income.service.js';
import { createGamePipeline } from './_phases/index.js';
import { GamePipeline } from './_pipeline.js';
import {
  createInitialTurnState,
  type EndTurnResult,
  type GameWithCharacter,
  type TurnContext,
} from './_types.js';

const endTurnLocks = new Map<string, Promise<EndTurnResult>>();

const EMPTY_PASSIVE_INCOME: EndTurnResult['passiveIncome'] = {
  salary: 0,
  livingExpense: 0,
  livingExpenseReceipts: [],
  installmentTotal: 0,
  installmentPayments: [],
  passiveIncome: 0,
  itemsPaidOff: [],
  netChange: 0,
};

export class GameService {
  readonly #pipeline: GamePipeline;
  readonly #newsService: NewsGenerationService;
  readonly #propertyOffersService: PropertyOffersService;
  readonly #otcDealsService: OtcDealsService;
  readonly #passiveIncomeService: PassiveIncomeService;
  readonly #savesService: SavesService;
  readonly #characterSkillsService: CharacterSkillsService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#pipeline = createGamePipeline(prisma);
    this.#newsService = new NewsGenerationService(prisma);
    this.#propertyOffersService = new PropertyOffersService(prisma);
    this.#otcDealsService = new OtcDealsService(prisma);
    this.#passiveIncomeService = new PassiveIncomeService(prisma);
    this.#savesService = new SavesService(prisma);
    this.#characterSkillsService = new CharacterSkillsService(prisma);
  }

  async endTurn(userId: string, saveId: string, expectedStep: number): Promise<EndTurnResult> {
    const inflight = endTurnLocks.get(saveId);
    if (inflight) {
      return inflight;
    }

    const run = this.#runEndTurn(userId, saveId, expectedStep).finally(() => {
      if (endTurnLocks.get(saveId) === run) {
        endTurnLocks.delete(saveId);
      }
    });

    endTurnLocks.set(saveId, run);
    return run;
  }

  async #runEndTurn(
    userId: string,
    saveId: string,
    expectedStep: number,
  ): Promise<EndTurnResult> {
    const game = await this.#loadGame(userId, saveId);

    if (game.step !== expectedStep) {
      return this.#buildCurrentTurnSnapshot(saveId, game);
    }

    const context: TurnContext = {
      userId,
      gameId: saveId,
      game,
      playerPortfolioTickers: [],
    };
    const state = createInitialTurnState(game.character.professionLevel);

    await this.#pipeline.run(context, state);

    if (!state.passiveIncome) {
      throw new Error('Economy phase did not run');
    }

    const character = context.game.character;
    const nextTurnForecast = this.#passiveIncomeService.buildForecast(
      character,
      context.game.step,
      saveId,
    );
    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      character.bankingLevel,
      context.game.step,
      character.inventoryItems,
    );

    return {
      step: context.game.step,
      balance: character.balance,
      character: serializeCharacter(character),
      nextTurnForecast,
      passiveIncome: state.passiveIncome,
      insiderChancePercent: state.insiderChancePercent,
      insiderRolled: state.insiderRolled,
      news: state.news,
      otcDeal: state.otcDeal,
      propertyOffers,
      appliedPriceImpacts: state.appliedPriceImpacts,
      characterSkills: this.#characterSkillsService.buildState(character),
    };
  }

  async acceptPropertyOffer(
    userId: string,
    saveId: string,
    offerId: string,
    paymentMode: import('../property_offers/_deal.js').PropertyOfferPaymentMode = 'installment',
  ) {
    const game = await this.#loadGame(userId, saveId);
    const result = await this.#propertyOffersService.accept(
      userId,
      saveId,
      offerId,
      game.character,
      game.step,
      paymentMode,
    );

    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      result.character.bankingLevel,
      game.step,
      result.character.inventoryItems,
    );

    return {
      balance: result.balance,
      previousBalance: result.previousBalance,
      previousReputation: result.previousReputation,
      reputation: result.reputation,
      profitAmount: result.profitAmount,
      installmentBreakdown: result.installmentBreakdown,
      deal: result.deal,
      character: serializeCharacter(result.character),
      propertyOffers,
      news: result.news,
      nextTurnForecast: this.#passiveIncomeService.buildForecast(
        result.character,
        game.step,
        saveId,
      ),
    };
  }

  async acceptOtcDeal(
    userId: string,
    saveId: string,
    deal: import('../news/types.js').GeneratedOtcDeal,
  ) {
    const game = await this.#loadGame(userId, saveId);
    const result = await this.#otcDealsService.accept(
      saveId,
      game.step,
      game.character,
      deal,
    );

    return {
      balance: result.balance,
      character: serializeCharacter(result.character),
      news: result.news,
    };
  }

  async negotiatePropertyOffer(
    userId: string,
    saveId: string,
    offerId: string,
    adjustmentPercent: number,
  ) {
    const game = await this.#loadGame(userId, saveId);
    const result = await this.#propertyOffersService.negotiate(
      userId,
      saveId,
      offerId,
      adjustmentPercent,
      game.character,
      game.step,
    );

    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      result.character.bankingLevel,
      game.step,
      result.character.inventoryItems,
    );

    return {
      success: result.success,
      d20: result.d20,
      roll: result.roll,
      target: result.target,
      negotiatedPrice: result.negotiatedPrice,
      deal: result.deal,
      previousReputation: result.previousReputation,
      reputation: result.reputation,
      previousBalance: result.previousBalance,
      balance: result.balance,
      propertyOffers,
      character: serializeCharacter(result.character),
      news: result.news,
    };
  }

  async acceptNegotiatedPropertyOffer(
    userId: string,
    saveId: string,
    offerId: string,
    paymentMode: import('../property_offers/_deal.js').PropertyOfferPaymentMode = 'installment',
  ) {
    const game = await this.#loadGame(userId, saveId);
    const result = await this.#propertyOffersService.acceptNegotiated(
      userId,
      saveId,
      offerId,
      game.character,
      game.step,
      paymentMode,
    );

    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      result.character.bankingLevel,
      game.step,
      result.character.inventoryItems,
    );

    return {
      balance: result.balance,
      previousBalance: result.previousBalance,
      previousReputation: result.previousReputation,
      reputation: result.reputation,
      profitAmount: result.profitAmount,
      installmentBreakdown: result.installmentBreakdown,
      deal: result.deal,
      character: serializeCharacter(result.character),
      propertyOffers,
      news: result.news,
      nextTurnForecast: this.#passiveIncomeService.buildForecast(
        result.character,
        game.step,
        saveId,
      ),
    };
  }

  async declineNegotiatedPropertyOffer(userId: string, saveId: string, offerId: string) {
    const game = await this.#loadGame(userId, saveId);
    await this.#propertyOffersService.declineNegotiated(saveId, offerId, game.step);

    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      game.character.bankingLevel,
      game.step,
      game.character.inventoryItems,
    );

    return { propertyOffers };
  }

  async #buildCurrentTurnSnapshot(
    saveId: string,
    game: GameWithCharacter,
  ): Promise<EndTurnResult> {
    const news = await this.#newsService.listGameNews(saveId, 5);
    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      game.character.bankingLevel,
      game.step,
      game.character.inventoryItems,
    );

    return {
      step: game.step,
      balance: game.character.balance,
      character: serializeCharacter(game.character),
      nextTurnForecast: this.#passiveIncomeService.buildForecast(
        game.character,
        game.step,
        saveId,
      ),
      passiveIncome: EMPTY_PASSIVE_INCOME,
      insiderChancePercent: 0,
      insiderRolled: false,
      news,
      propertyOffers,
      characterSkills: this.#characterSkillsService.buildState(game.character),
    };
  }

  async getNews(userId: string, saveId: string) {
    await this.#assertGameAccess(userId, saveId);
    const news = await this.#newsService.listGameNews(saveId);
    return { news };
  }

  async getNextTurnForecast(userId: string, saveId: string) {
    const game = await this.#loadGame(userId, saveId);
    const inventoryItems = await this.#passiveIncomeService.reconcilePaidOffInstallments(
      game.character.inventoryItems,
    );

    return this.#passiveIncomeService.buildForecast(
      { ...game.character, inventoryItems },
      game.step,
      game.id,
    );
  }

  async getDashboard(userId: string, saveId: string) {
    const game = await this.#loadGame(userId, saveId);
    const bootstrapped = await this.#savesService.ensureGameBootstrap(game);
    const inventoryItems = await this.#passiveIncomeService.reconcilePaidOffInstallments(
      bootstrapped.character.inventoryItems,
    );
    const character = { ...bootstrapped.character, inventoryItems };
    const news = await this.#newsService.listGameNews(saveId);
    const nextTurnForecast = this.#passiveIncomeService.buildForecast(
      character,
      bootstrapped.step,
      bootstrapped.id,
    );
    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      character.bankingLevel,
      bootstrapped.step,
      inventoryItems,
    );

    return {
      game: serializeGame({ ...bootstrapped, character }),
      news,
      nextTurnForecast,
      characterSkills: this.#characterSkillsService.buildState(character),
      propertyOffers,
    };
  }

  async payOffInstallment(userId: string, saveId: string, itemId: string) {
    const game = await this.#loadGame(userId, saveId);
    const result = await this.#propertyOffersService.payOffInstallment(userId, saveId, itemId);

    return {
      balance: result.balance,
      previousBalance: result.previousBalance,
      character: serializeCharacter(result.character),
      news: result.news,
      nextTurnForecast: this.#passiveIncomeService.buildForecast(
        result.character,
        game.step,
        saveId,
      ),
    };
  }

  async upgradeSkill(userId: string, saveId: string, skillId: string) {
    const { character, characterSkills } = await this.#characterSkillsService.upgradeSkill(
      userId,
      saveId,
      skillId,
    );

    const game = await this.#prisma.game.findFirstOrThrow({
      where: { id: saveId, userId },
      include: {
        character: {
          include: {
            inventoryItems: {
              orderBy: { purchasedAt: 'asc' },
            },
          },
        },
      },
    });

    const nextTurnForecast = this.#passiveIncomeService.buildForecast(
      character,
      game.step,
      saveId,
    );

    return {
      game: serializeGame({ ...game, character }),
      characterSkills,
      nextTurnForecast,
    };
  }

  async #loadGame(userId: string, saveId: string): Promise<GameWithCharacter> {
    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
      include: {
        character: {
          include: {
            inventoryItems: {
              orderBy: { purchasedAt: 'asc' },
            },
          },
        },
      },
    });

    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }

    return game as GameWithCharacter;
  }

  async #assertGameAccess(userId: string, saveId: string) {
    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
    });

    if (!game) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }
  }
}
