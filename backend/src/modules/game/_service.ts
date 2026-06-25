import type { PrismaClient } from '@prisma/client';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { AppError } from '../../utils/errors.js';
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
  passiveIncome: 0,
  itemsPaidOff: [],
  netChange: 0,
};

export class GameService {
  readonly #pipeline: GamePipeline;
  readonly #newsService: NewsGenerationService;
  readonly #passiveIncomeService: PassiveIncomeService;
  readonly #savesService: SavesService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#pipeline = createGamePipeline(prisma);
    this.#newsService = new NewsGenerationService(prisma);
    this.#passiveIncomeService = new PassiveIncomeService(prisma);
    this.#savesService = new SavesService(prisma);
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
      propertyOffer: state.propertyOffer,
      appliedPriceImpacts: state.appliedPriceImpacts,
    };
  }

  async #buildCurrentTurnSnapshot(
    saveId: string,
    game: GameWithCharacter,
  ): Promise<EndTurnResult> {
    const news = await this.#newsService.listGameNews(saveId, 5);

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
    };
  }

  async getNews(userId: string, saveId: string) {
    await this.#assertGameAccess(userId, saveId);
    const news = await this.#newsService.listGameNews(saveId);
    return { news };
  }

  async getNextTurnForecast(userId: string, saveId: string) {
    const game = await this.#loadGame(userId, saveId);
    return this.#passiveIncomeService.buildForecast(game.character, game.step, game.id);
  }

  async getDashboard(userId: string, saveId: string) {
    const game = await this.#loadGame(userId, saveId);
    const bootstrapped = await this.#savesService.ensureGameBootstrap(game);
    const news = await this.#newsService.listGameNews(saveId);
    const nextTurnForecast = this.#passiveIncomeService.buildForecast(
      bootstrapped.character,
      bootstrapped.step,
      bootstrapped.id,
    );

    return {
      game: serializeGame(bootstrapped),
      news,
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
