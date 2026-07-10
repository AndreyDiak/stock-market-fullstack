import type {
  Character,
  MarketSector,
  Prisma,
  PrismaClient,
  StockGrade,
} from '@prisma/client';
import { COMPANIES } from '../../assets/companies.js';
import {
  pickInitialListingGrade,
  randomPriceInGradeRange,
  STOCK_GRADE_CONFIG,
} from '../../assets/stock_grade.js';
import { AppError } from '../../utils/errors.js';
import { ensureCompanyByTicker } from './company_catalog.js';
import {
  calculateNextPrice,
  calculateVolatilityBoost,
  decayNewsPressureImpact,
  sumNewsPressures,
} from './market_engine.js';
import { getSentimentIndicator, processSentimentTurn } from './market_sentiment.engine.js';
import { decaySectorMomentum, getSectorStatus } from './sector_momentum.engine.js';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { IPOManager } from './ipo.manager.js';
import { buildWarmupHistoryRecords } from './sparkline_seed.js';
import {
  calcDividendPerShare,
  DividendService,
  rollDividendProfile,
  type DividendPayoutEvent,
} from './dividend.service.js';
import { calcNetSellProceeds } from './sell_commission.js';
import {
  resolveStockArchetype,
  STOCK_ARCHETYPE_LABELS,
  type StockArchetype,
} from './stock_archetype.js';
import type { PersistedNewsItem } from '../news/types.js';
import type { TurnForecast } from '../game/_passive_income.service.js';

const ALL_SECTORS: MarketSector[] = [
  'TECHNOLOGY',
  'HEALTHCARE',
  'FINANCE',
  'AGRICULTURE',
  'ENERGY',
];

export interface StockListingDto {
  id: string;
  companyId: string;
  ticker: string;
  name: string;
  sector: MarketSector;
  grade: StockGrade;
  currentPrice: number;
  previousPrice: number;
  dayChange: number;
  availableOnExchange: boolean;
  isLocked: boolean;
  hasInsiderPressure: boolean;
  hasNewsPressure: boolean;
  archetype: StockArchetype | null;
  archetypeLabel: string | null;
  paysDividends: boolean;
  turnsUntilDividend: number | null;
  dividendPerShare: number | null;
  history: PriceHistoryPointDto[];
}

export interface PortfolioRowDto {
  ticker: string;
  name: string;
  qty: number;
  price: number;
  purchasePrice: number;
  changePct: number;
  pnl: number;
  listingId: string;
  paysDividends: boolean;
  turnsUntilDividend: number | null;
  turnsHeldInCycle: number;
}

export interface PriceHistoryPointDto {
  turn: number;
  price: number;
}

export interface MarketTurnResult {
  dividendPayouts: DividendPayoutEvent[];
  dividendNews: PersistedNewsItem[];
}

export class MarketService {
  readonly #prisma: PrismaClient;
  readonly #newsService: NewsGenerationService;
  readonly #ipoManager: IPOManager;
  readonly #dividendService: DividendService;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#newsService = new NewsGenerationService(prisma);
    this.#ipoManager = new IPOManager(prisma);
    this.#dividendService = new DividendService(prisma);
  }

  get ipo() {
    return this.#ipoManager;
  }

  async ensureMarketInitialized(gameId: string): Promise<void> {
    const count = await this.#prisma.gameStockListing.count({ where: { gameId } });
    if (count > 0) return;
    await this.initializeMarket(gameId);
  }

  async initializeMarket(gameId: string, rng: () => number = Math.random): Promise<void> {
    for (const company of COMPANIES) {
      const dbCompany = await ensureCompanyByTicker(this.#prisma, company.ticker);
      const grade = pickInitialListingGrade(rng);
      const config = STOCK_GRADE_CONFIG[grade];
      const currentPrice = randomPriceInGradeRange(grade, rng);
      const dividendProfile = rollDividendProfile(grade, rng);

      const listing = await this.#prisma.gameStockListing.upsert({
        where: { gameId_companyId: { gameId, companyId: dbCompany.id } },
        create: {
          gameId,
          companyId: dbCompany.id,
          grade,
          currentPrice,
          previousPrice: currentPrice,
          dayChange: 0,
          availableOnExchange: config.availableOnExchange,
          ...dividendProfile,
        },
        update: {},
      });

      const historyCount = await this.#prisma.priceHistory.count({
        where: { stockListingId: listing.id },
      });

      if (historyCount === 0) {
        await this.#seedListingWarmupHistory({
          gameId,
          companyId: dbCompany.id,
          listingId: listing.id,
          ticker: company.ticker,
          grade,
          currentPrice,
        });
      }
    }

    await this.#prisma.marketSentiment.upsert({
      where: { gameId },
      create: { gameId, value: 0 },
      update: {},
    });

    for (const sector of ALL_SECTORS) {
      await this.#prisma.sectorMomentum.upsert({
        where: { gameId_sector: { gameId, sector } },
        create: { gameId, sector, value: 0, duration: 0, trend: 'neutral' },
        update: {},
      });
    }
  }

  async processTurn(
    gameId: string,
    turn: number,
    characterId: string,
  ): Promise<MarketTurnResult> {
    await this.ensureMarketInitialized(gameId);

    const sentimentRow = await this.#prisma.marketSentiment.findUnique({ where: { gameId } });
    if (sentimentRow) {
      const next = processSentimentTurn(sentimentRow.value);
      await this.#prisma.marketSentiment.update({
        where: { gameId },
        data: { value: next },
      });
    }

    const sectors = await this.#prisma.sectorMomentum.findMany({ where: { gameId } });
    for (const sector of sectors) {
      const decayed = decaySectorMomentum(sector.value, sector.duration);
      await this.#prisma.sectorMomentum.update({
        where: { id: sector.id },
        data: {
          value: decayed.value,
          duration: decayed.duration,
          trend: decayed.value >= 0.25 ? 'rising' : decayed.value <= -0.25 ? 'falling' : 'neutral',
        },
      });
    }

    await this.#decayNewsPressures(gameId);

    const listings = await this.#prisma.gameStockListing.findMany({
      where: { gameId },
      include: {
        company: true,
        newsPressures: {
          where: { remainingTurns: { gt: 0 } },
          include: { news: { select: { kind: true } } },
        },
      },
    });

    const sentiment = (await this.#prisma.marketSentiment.findUnique({ where: { gameId } }))?.value ?? 0;
    const sectorRows = await this.#prisma.sectorMomentum.findMany({ where: { gameId } });
    const sectorMap = new Map(sectorRows.map((row) => [row.sector, row.value]));
    const sectorDurationMap = new Map(sectorRows.map((row) => [row.sector, row.duration]));

    for (const listing of listings) {
      const sector = listing.company.sector;
      const newsPressureTotal = sumNewsPressures(listing.newsPressures);
      const sectorMomentum = sectorMap.get(sector) ?? 0;
      const forces = {
        newsPressureTotal,
        sectorMomentum,
        marketSentiment: sentiment,
        volatilityBoost: calculateVolatilityBoost({
          newsPressureTotal,
          sectorMomentum,
          sectorDuration: sectorDurationMap.get(sector) ?? 0,
          marketSentiment: sentiment,
        }),
      };

      const { newPrice, dayChangePct } = calculateNextPrice(
        { currentPrice: listing.currentPrice, grade: listing.grade },
        forces,
      );

      await this.#prisma.$transaction([
        this.#prisma.gameStockListing.update({
          where: { id: listing.id },
          data: {
            previousPrice: listing.currentPrice,
            currentPrice: newPrice,
            dayChange: dayChangePct,
          },
        }),
        this.#prisma.priceHistory.create({
          data: {
            gameId,
            companyId: listing.companyId,
            stockListingId: listing.id,
            turn,
            price: newPrice,
          },
        }),
      ]);
    }

    await this.#ipoManager.processTurn(gameId, turn);

    const dividendPayouts = await this.#dividendService.processTurn(gameId, turn, characterId);
    const dividendNews: PersistedNewsItem[] = [];

    for (const payout of dividendPayouts) {
      const news = await this.#newsService.createStockDividendNews({
        gameId,
        gameStep: turn,
        ticker: payout.ticker,
        companyName: payout.companyName,
      });
      dividendNews.push(news);
    }

    return { dividendPayouts, dividendNews };
  }

  async enrichForecastWithDividends(
    forecast: TurnForecast,
    gameId: string,
    characterId: string,
  ): Promise<TurnForecast> {
    const dividendLine = await this.#dividendService.estimateNextTurnDividends(gameId, characterId);
    if (!dividendLine) return forecast;

    const lines = [...forecast.lines, { id: 'dividends', label: dividendLine.label, amount: dividendLine.amount }];
    const incomeTotal = forecast.incomeTotal + dividendLine.amount;

    return {
      lines,
      incomeTotal,
      expenseTotal: forecast.expenseTotal,
      netChange: incomeTotal - forecast.expenseTotal,
    };
  }

  async listStocks(gameId: string, character: Character): Promise<StockListingDto[]> {
    await this.ensureMarketInitialized(gameId);

    const listings = await this.#prisma.gameStockListing.findMany({
      where: { gameId },
      include: {
        company: true,
        newsPressures: {
          where: { remainingTurns: { gt: 0 } },
          include: { news: { select: { kind: true } } },
        },
      },
      orderBy: { company: { ticker: 'asc' } },
    });

    const histories = await this.#loadHistoriesForListings(listings.map((listing) => listing.id));

    return listings.map((listing) =>
      this.#toListingDto(listing, character, histories.get(listing.id) ?? []),
    );
  }

  async getStockDetail(gameId: string, listingId: string, character: Character) {
    const listing = await this.#loadListing(gameId, listingId);
    const history = await this.getHistory(gameId, listingId, 20);
    return {
      listing: this.#toListingDto(listing, character, history),
      history,
    };
  }

  async getHistory(gameId: string, listingId: string, limit = 20): Promise<PriceHistoryPointDto[]> {
    await this.#loadListing(gameId, listingId);

    const rows = await this.#prisma.priceHistory.findMany({
      where: { stockListingId: listingId },
      orderBy: [{ turn: 'asc' }, { timestamp: 'asc' }],
      take: limit * 2,
    });

    return MarketService.#normalizeHistoryRows(rows).slice(-limit);
  }

  async buyStock(
    gameId: string,
    listingId: string,
    character: Character,
    quantity: number,
    gameStep: number,
  ) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be a positive integer');
    }

    const listing = await this.#loadListing(gameId, listingId);
    const gradeConfig = STOCK_GRADE_CONFIG[listing.grade];

    if (!listing.availableOnExchange) {
      throw new AppError(400, 'STOCK_LOCKED', 'This stock is not available on the exchange');
    }

    if (character.bankingLevel < gradeConfig.minBankingLevel) {
      throw new AppError(400, 'BANKING_LEVEL_TOO_LOW', 'Banking level too low for this stock');
    }

    if (character.reputation < gradeConfig.minReputation) {
      throw new AppError(400, 'REPUTATION_TOO_LOW', 'Reputation too low for this stock');
    }

    const total = listing.currentPrice * quantity;
    if (character.balance < total) {
      throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
    }

    const updated = await this.#prisma.$transaction(async (tx) => {
      const current = await tx.character.findUniqueOrThrow({ where: { id: character.id } });
      if (current.balance < total) {
        throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
      }

      const existing = await tx.stock.findFirst({
        where: { ownerId: character.id, companyId: listing.companyId, gameId },
      });

      if (existing) {
        const nextQty = existing.quantity + quantity;
        const nextPrice =
          (existing.purchasePrice * existing.quantity + listing.currentPrice * quantity) / nextQty;
        await tx.stock.update({
          where: { id: existing.id },
          data: { quantity: nextQty, purchasePrice: nextPrice },
        });
      } else {
        await tx.stock.create({
          data: {
            ownerId: character.id,
            companyId: listing.companyId,
            gameId,
            purchasePrice: listing.currentPrice,
            quantity,
          },
        });
      }

      return tx.character.update({
        where: { id: character.id },
        data: {
          balance: { decrement: total },
          totalSpent: { increment: total },
          totalTrades: { increment: 1 },
          successfulTrades: { increment: 1 },
        },
        include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
      });
    });

    const news = await this.#newsService.createStockTradeNews({
      gameId,
      gameStep,
      ticker: listing.company.ticker,
      companyName: listing.company.name,
      playerAction: 'buy',
      qty: quantity,
      price: listing.currentPrice,
    });

    await this.#prisma.stockTrade.create({
      data: {
        gameId,
        characterId: character.id,
        ticker: listing.company.ticker,
        companyName: listing.company.name,
        sector: listing.company.sector,
        operationType: 'buy',
        quantity,
        price: listing.currentPrice,
        total,
        turn: gameStep,
      },
    });

    const portfolio = await this.getPortfolio(gameId, updated);

    return {
      balance: updated.balance,
      character: updated,
      news,
      portfolio,
    };
  }

  async sellStock(
    gameId: string,
    listingId: string,
    character: Character,
    quantity: number,
    gameStep: number,
  ) {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new AppError(400, 'INVALID_QUANTITY', 'Quantity must be a positive integer');
    }

    const listing = await this.#loadListing(gameId, listingId);

    if (!listing.availableOnExchange) {
      throw new AppError(400, 'STOCK_LOCKED', 'This stock is not available on the exchange');
    }

    const holding = await this.#prisma.stock.findFirst({
      where: { ownerId: character.id, companyId: listing.companyId, gameId },
    });

    if (!holding || holding.quantity < quantity) {
      throw new AppError(400, 'INSUFFICIENT_SHARES', 'Not enough shares to sell');
    }

    const gross = listing.currentPrice * quantity;
    const { net, commissionPercent, commissionAmount } = calcNetSellProceeds(
      gross,
      character.tradingLevel,
    );

    const nextQty = holding.quantity - quantity;

    const updated = await this.#prisma.$transaction(async (tx) => {
      if (nextQty === 0) {
        await tx.stock.delete({ where: { id: holding.id } });
      } else {
        await tx.stock.update({
          where: { id: holding.id },
          data: { quantity: nextQty },
        });
      }

      return tx.character.update({
        where: { id: character.id },
        data: {
          balance: { increment: net },
          totalEarned: { increment: net },
          totalTrades: { increment: 1 },
          successfulTrades: { increment: 1 },
        },
        include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
      });
    });

    await this.#prisma.stockTrade.create({
      data: {
        gameId,
        characterId: character.id,
        ticker: listing.company.ticker,
        companyName: listing.company.name,
        sector: listing.company.sector,
        operationType: 'sell',
        quantity,
        price: listing.currentPrice,
        total: gross,
        netTotal: net,
        commission: commissionAmount,
        turn: gameStep,
      },
    });

    const portfolio = await this.getPortfolio(gameId, updated);

    return {
      balance: updated.balance,
      character: updated,
      portfolio,
      gross,
      commissionPercent,
      commissionAmount,
      net,
    };
  }

  async getPortfolio(gameId: string, character: Character): Promise<PortfolioRowDto[]> {
    const holdings = await this.#prisma.stock.findMany({
      where: { ownerId: character.id, gameId },
      include: { company: true },
    });

    if (holdings.length === 0) return [];

    const listings = await this.#prisma.gameStockListing.findMany({
      where: {
        gameId,
        companyId: { in: holdings.map((holding) => holding.companyId) },
      },
    });
    const listingByCompany = new Map(listings.map((listing) => [listing.companyId, listing]));

    return holdings.map((holding) => {
      const listing = listingByCompany.get(holding.companyId);
      const price = listing?.currentPrice ?? holding.purchasePrice;
      const changePct = listing?.dayChange ?? 0;
      const pnl = (price - holding.purchasePrice) * holding.quantity;

      return {
        ticker: holding.company.ticker,
        name: holding.company.name,
        qty: holding.quantity,
        price,
        purchasePrice: holding.purchasePrice,
        changePct,
        pnl: Number(pnl.toFixed(2)),
        listingId: listing?.id ?? '',
        paysDividends: listing?.paysDividends ?? false,
        turnsUntilDividend: listing?.turnsUntilDividend ?? null,
        turnsHeldInCycle: holding.turnsHeldInCycle,
      };
    });
  }

  async getMarketSentiment(gameId: string) {
    await this.ensureMarketInitialized(gameId);
    const row = await this.#prisma.marketSentiment.findUnique({ where: { gameId } });
    const value = row?.value ?? 0;
    return { value, indicator: getSentimentIndicator(value) };
  }

  async getSectorMomentum(gameId: string) {
    await this.ensureMarketInitialized(gameId);
    const rows = await this.#prisma.sectorMomentum.findMany({ where: { gameId } });
    return rows.map((row) => getSectorStatus(row.sector, row.value, row.duration));
  }

  async getDashboardMarketData(gameId: string, character: Character) {
    const [stocks, portfolio, marketSentiment, sectorMomentum] = await Promise.all([
      this.listStocks(gameId, character),
      this.getPortfolio(gameId, character),
      this.getMarketSentiment(gameId),
      this.getSectorMomentum(gameId),
    ]);

    return { stocks, portfolio, marketSentiment, sectorMomentum };
  }

  async getPlayerPortfolioTickers(characterId: string, gameId: string): Promise<string[]> {
    const holdings = await this.#prisma.stock.findMany({
      where: { ownerId: characterId, gameId },
      include: { company: true },
    });
    return holdings.map((holding) => holding.company.ticker);
  }

  async #decayNewsPressures(gameId: string) {
    const pressures = await this.#prisma.newsPressure.findMany({
      where: { gameId, remainingTurns: { gt: 0 } },
    });

    for (const pressure of pressures) {
      const nextImpact = decayNewsPressureImpact(pressure.impact, pressure.decayRate);
      const nextTurns = pressure.remainingTurns - 1;

      if (nextTurns <= 0 || Math.abs(nextImpact) < 0.05) {
        await this.#prisma.newsPressure.delete({ where: { id: pressure.id } });
      } else {
        await this.#prisma.newsPressure.update({
          where: { id: pressure.id },
          data: { impact: nextImpact, remainingTurns: nextTurns },
        });
      }
    }
  }

  async #loadListing(gameId: string, listingId: string) {
    const listing = await this.#prisma.gameStockListing.findFirst({
      where: { id: listingId, gameId },
      include: {
        company: true,
        newsPressures: {
          where: { remainingTurns: { gt: 0 } },
          include: { news: { select: { kind: true } } },
        },
      },
    });

    if (!listing) {
      throw new AppError(404, 'STOCK_NOT_FOUND', 'Stock listing not found');
    }

    return listing;
  }

  async #loadHistoriesForListings(listingIds: string[]) {
    const map = new Map<string, PriceHistoryPointDto[]>();
    if (listingIds.length === 0) return map;

    const rows = await this.#prisma.priceHistory.findMany({
      where: { stockListingId: { in: listingIds } },
      orderBy: [{ turn: 'asc' }, { timestamp: 'asc' }],
    });

    const rowsByListing = new Map<string, typeof rows>();
    for (const row of rows) {
      if (!row.stockListingId) continue;
      const bucket = rowsByListing.get(row.stockListingId) ?? [];
      bucket.push(row);
      rowsByListing.set(row.stockListingId, bucket);
    }

    for (const listingId of listingIds) {
      const listingRows = rowsByListing.get(listingId) ?? [];
      map.set(listingId, MarketService.#normalizeHistoryRows(listingRows).slice(-20));
    }

    return map;
  }

  async #seedListingWarmupHistory(input: {
    gameId: string;
    companyId: string;
    listingId: string;
    ticker: string;
    grade: StockGrade;
    currentPrice: number;
  }) {
    await this.#prisma.priceHistory.createMany({
      data: buildWarmupHistoryRecords(input),
    });
  }

  static #normalizeHistoryRows(
    rows: Array<{ turn: number | null; price: number }>,
  ): PriceHistoryPointDto[] {
    const byTurn = new Map<number, PriceHistoryPointDto>();

    for (const row of rows) {
      const turn = row.turn ?? 0;
      byTurn.set(turn, { turn, price: row.price });
    }

    return [...byTurn.entries()]
      .sort(([leftTurn], [rightTurn]) => leftTurn - rightTurn)
      .map(([, point]) => point);
  }

  #toListingDto(
    listing: Prisma.GameStockListingGetPayload<{
      include: {
        company: true;
        newsPressures: {
          where: { remainingTurns: { gt: 0 } };
          include: { news: { select: { kind: true } } };
        };
      };
    }>,
    character: Character,
    history: PriceHistoryPointDto[] = [],
  ): StockListingDto {
    const gradeConfig = STOCK_GRADE_CONFIG[listing.grade];
    const bankingLocked = character.bankingLevel < gradeConfig.minBankingLevel;
    const reputationLocked = character.reputation < gradeConfig.minReputation;
    const exchangeLocked = !listing.availableOnExchange;
    const archetype = resolveStockArchetype({
      sector: listing.company.sector,
      grade: listing.grade,
      paysDividends: listing.paysDividends,
    });

    const hasInsiderPressure = listing.newsPressures.some(
      (pressure) => pressure.news?.kind === 'INSIDER',
    );
    const hasNewsPressure = listing.newsPressures.some(
      (pressure) => pressure.news?.kind !== 'INSIDER',
    );

    return {
      id: listing.id,
      companyId: listing.companyId,
      ticker: listing.company.ticker,
      name: listing.company.name,
      sector: listing.company.sector,
      grade: listing.grade,
      currentPrice: listing.currentPrice,
      previousPrice: listing.previousPrice,
      dayChange: listing.dayChange,
      availableOnExchange: listing.availableOnExchange,
      isLocked: exchangeLocked || bankingLocked || reputationLocked,
      hasInsiderPressure,
      hasNewsPressure,
      archetype,
      archetypeLabel: archetype ? STOCK_ARCHETYPE_LABELS[archetype] : null,
      paysDividends: listing.paysDividends,
      turnsUntilDividend: listing.turnsUntilDividend,
      dividendPerShare: listing.paysDividends
        ? calcDividendPerShare(listing.currentPrice, listing.dividendYieldPct)
        : null,
      history,
    };
  }
}
