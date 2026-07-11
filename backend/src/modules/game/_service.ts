import type { PrismaClient } from '@prisma/client';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { PropertyOffersService } from '../property_offers/property_offers.service.js';
import { OtcDealsService } from '../otc_deals/otc_deals.service.js';
import { DealService } from '../deals/deal.service.js';
import { AppError } from '../../utils/errors.js';
import { CharacterSkillsService } from '../character_skills/character_skills.service.js';
import { serializeCharacter, serializeGame } from '../saves/game_serializer.js';
import { SavesService } from '../saves/saves.service.js';
import { MarketService } from '../market/market.service.js';
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
  readonly #dealService: DealService;
  readonly #passiveIncomeService: PassiveIncomeService;
  readonly #savesService: SavesService;
  readonly #marketService: MarketService;
  readonly #characterSkillsService: CharacterSkillsService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#pipeline = createGamePipeline(prisma);
    this.#newsService = new NewsGenerationService(prisma);
    this.#propertyOffersService = new PropertyOffersService(prisma);
    this.#otcDealsService = new OtcDealsService(prisma);
    this.#dealService = new DealService(prisma);
    this.#passiveIncomeService = new PassiveIncomeService(prisma);
    this.#savesService = new SavesService(prisma);
    this.#marketService = new MarketService(prisma);
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
      playerPortfolioTickers: await this.#marketService.getPlayerPortfolioTickers(
        game.character.id,
        saveId,
      ),
    };
    const state = createInitialTurnState(game.character.professionLevel);

    await this.#pipeline.run(context, state);

    if (!state.passiveIncome) {
      throw new Error('Economy phase did not run');
    }

    const character = context.game.character;

    const dividendTotal = state.dividendPayouts?.reduce((s, p) => s + p.totalPaid, 0) ?? 0;

    const newBalance = character.balance;

    character.balance = newBalance;

    if (newBalance < 0) {
      await this.#prisma.game.update({
        where: { id: saveId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    const baseForecast = this.#passiveIncomeService.buildForecast(
      character,
      context.game.step,
      saveId,
    );
    const nextTurnForecast = await this.#marketService.enrichForecastWithDividends(
      baseForecast,
      saveId,
      character.id,
    );
    const propertyOffers = await this.#propertyOffersService.listActive(
      saveId,
      character.bankingLevel,
      context.game.step,
      character.inventoryItems,
    );
    const dealOffers = await this.#listActiveDeals(saveId, context.game.step);

    return {
      step: context.game.step,
      balance: newBalance,
      character: serializeCharacter(character),
      nextTurnForecast,
      passiveIncome: state.passiveIncome,
      insiderChancePercent: state.insiderChancePercent,
      insiderRolled: state.insiderRolled,
      news: state.news,
      otcDeal: state.otcDeal,
      dealOffers,
      propertyOffers,
      characterSkills: this.#characterSkillsService.buildState(character),
      dividendPayouts: state.dividendPayouts,
      gameOver: newBalance < 0,
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

  async acceptDeal(
    userId: string,
    saveId: string,
    dealId: string,
  ) {
    const game = await this.#loadGame(userId, saveId);

    const dealRow = await this.#prisma.dealOffer.findFirst({
      where: { id: dealId, gameId: saveId, status: 'ACTIVE' },
    });

    if (!dealRow) {
      throw new AppError(404, 'DEAL_NOT_FOUND', 'Deal offer not found or not active');
    }

    if (dealRow.expiresTurn < game.step) {
      await this.#prisma.dealOffer.update({
        where: { id: dealId },
        data: { status: 'EXPIRED' },
      });
      throw new AppError(410, 'DEAL_EXPIRED', 'Deal offer has expired');
    }

    const deal = {
      id: dealRow.id,
      purpose: dealRow.purpose ?? 'VALUE_EXCHANGE',
      botCharacterId: dealRow.botCharacterId,
      botName: '',
      botProfession: '',
      botGives: dealRow.botGives as unknown as import('../deals/deal.types.js').DealBundle,
      playerGives: dealRow.playerGives as unknown as import('../deals/deal.types.js').DealBundle,
      requiredReputation: dealRow.requiredReputation,
      requiredTradingLevel: dealRow.requiredTradingLevel,
      reputationPenalty: dealRow.reputationPenalty,
      playerBenefitValue: dealRow.playerBenefitValue,
      playerBenefitPercent: dealRow.playerBenefitPercent,
      status: dealRow.status as import('../deals/deal.types.js').DealOfferStatus,
      turnCreated: dealRow.turnCreated,
      expiresTurn: dealRow.expiresTurn,
      expiresInTurns: Math.max(0, dealRow.expiresTurn - game.step),
    };

    const botChar = await this.#prisma.character.findUnique({
      where: { id: dealRow.botCharacterId },
    });

    if (botChar) {
      deal.botName = botChar.name;
      deal.botProfession = botChar.profession;
    }

    const result = await this.#dealService.accept(
      saveId,
      game.step,
      game.character,
      deal,
    );

    return {
      balance: result.balance,
      previousBalance: result.previousBalance,
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
    const dealOffers = await this.#listActiveDeals(saveId, game.step);

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
      dealOffers,
      propertyOffers,
      characterSkills: this.#characterSkillsService.buildState(game.character),
      gameOver: false,
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

    return this.#buildEnrichedForecast(
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
    const nextTurnForecast = await this.#buildEnrichedForecast(
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
    const dealOffers = await this.#listActiveDeals(saveId, bootstrapped.step);
    const marketData = await this.#marketService.getDashboardMarketData(saveId, character);
    const ipos = await this.#marketService.ipo.listActive(saveId);

    return {
      game: serializeGame({ ...bootstrapped, character }),
      news,
      nextTurnForecast,
      characterSkills: this.#characterSkillsService.buildState(character),
      propertyOffers,
      dealOffers,
      stocks: marketData.stocks,
      portfolio: marketData.portfolio,
      marketSentiment: marketData.marketSentiment,
      sectorMomentum: marketData.sectorMomentum,
      ipos: ipos.map((ipo) => ({
        id: ipo.id,
        companyId: ipo.companyId,
        ticker: ipo.company.ticker,
        companyName: ipo.company.name,
        targetGrade: ipo.targetGrade,
        ipoPrice: ipo.ipoPrice,
        ipoShares: ipo.ipoShares,
        announcedAtTurn: ipo.announcedAtTurn,
        ipoAtTurn: ipo.ipoAtTurn,
        minSubscription: ipo.minSubscription,
        maxSubscription: ipo.maxSubscription,
        isCompleted: ipo.isCompleted,
        totalSubscribed: ipo.subscriptions.reduce((sum, sub) => sum + sub.amount, 0),
      })),
    };
  }

  async payOffInstallment(userId: string, saveId: string, itemId: string, payPercent: number) {
    const game = await this.#loadGame(userId, saveId);
    const result = await this.#propertyOffersService.payOffInstallment(
      userId,
      saveId,
      itemId,
      payPercent,
    );

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

  async #buildEnrichedForecast(
    character: GameWithCharacter['character'],
    step: number,
    gameId: string,
  ) {
    const baseForecast = this.#passiveIncomeService.buildForecast(character, step, gameId);
    return this.#marketService.enrichForecastWithDividends(baseForecast, gameId, character.id);
  }

  async #listActiveDeals(saveId: string, currentStep: number) {
    const activeRows = await this.#prisma.dealOffer.findMany({
      where: { gameId: saveId, status: 'ACTIVE', expiresTurn: { gte: currentStep } },
    });

    if (activeRows.length === 0) return [];

    const botIds = [...new Set(activeRows.map((r) => r.botCharacterId))];
    const bots = await this.#prisma.character.findMany({
      where: { id: { in: botIds } },
      select: { id: true, name: true, profession: true },
    });
    const botMap = new Map(bots.map((b) => [b.id, b]));

    return activeRows.map((row) => {
      const bot = botMap.get(row.botCharacterId);
      return {
        id: row.id,
        purpose: row.purpose ?? 'VALUE_EXCHANGE',
        botCharacterId: row.botCharacterId,
        botName: bot?.name ?? '',
        botProfession: bot?.profession ?? '',
        botGives: row.botGives as unknown as import('../deals/deal.types.js').DealBundle,
        playerGives: row.playerGives as unknown as import('../deals/deal.types.js').DealBundle,
        requiredReputation: row.requiredReputation,
        requiredTradingLevel: row.requiredTradingLevel,
        reputationPenalty: row.reputationPenalty,
        playerBenefitValue: row.playerBenefitValue,
        playerBenefitPercent: row.playerBenefitPercent,
        status: row.status as import('../deals/deal.types.js').DealOfferStatus,
        turnCreated: row.turnCreated,
        expiresTurn: row.expiresTurn,
        expiresInTurns: Math.max(0, row.expiresTurn - currentStep),
      };
    });
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
