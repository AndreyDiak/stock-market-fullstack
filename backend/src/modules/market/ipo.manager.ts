import type { PrismaClient, StockGrade } from '@prisma/client';
import { COMPANIES } from '../../assets/companies.js';
import { STOCK_GRADE_CONFIG, randomPriceInGradeRange } from '../../assets/stock_grade.js';
import { AppError } from '../../utils/errors.js';
import { ensureCompanyByTicker } from './company_catalog.js';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { buildWarmupHistoryRecords } from './sparkline_seed.js';

function targetGradeForTurn(turn: number): StockGrade {
  if (turn >= 40) return 'B';
  if (turn >= 25) return 'C';
  return 'D';
}

export class IPOManager {
  readonly #prisma: PrismaClient;
  readonly #newsService: NewsGenerationService;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#newsService = new NewsGenerationService(prisma);
  }

  async processTurn(gameId: string, turn: number): Promise<void> {
    const active = await this.#prisma.iPO.findFirst({
      where: { gameId, isCompleted: false },
    });

    if (active && turn >= active.ipoAtTurn) {
      await this.executeIPO(active.id);
      return;
    }

    if (turn >= 12 && turn % 8 === 0 && !active) {
      if (Math.random() < 0.45) {
        await this.checkForNewIPO(gameId, turn);
      }
    }
  }

  async checkForNewIPO(gameId: string, turn: number) {
    const pending = await this.#prisma.iPO.count({ where: { gameId, isCompleted: false } });
    if (pending > 0) return null;

    const lockedListings = await this.#prisma.gameStockListing.findMany({
      where: { gameId, availableOnExchange: false, grade: { in: ['B', 'C'] } },
      include: { company: true },
      take: 20,
    });

    if (lockedListings.length === 0) return null;

    const pick = lockedListings[Math.floor(Math.random() * lockedListings.length)]!;
    const targetGrade = targetGradeForTurn(turn);
    const announceLead = 3 + Math.floor(Math.random() * 6);

    return this.generateIPO({
      gameId,
      companyId: pick.companyId,
      targetGrade,
      announcedAtTurn: turn,
      ipoAtTurn: turn + announceLead,
    });
  }

  async generateIPO(input: {
    gameId: string;
    companyId: string;
    targetGrade: StockGrade;
    announcedAtTurn: number;
    ipoAtTurn: number;
  }) {
    const company = await this.#prisma.company.findUniqueOrThrow({
      where: { id: input.companyId },
    });

    const ipoPrice = randomPriceInGradeRange(input.targetGrade);
    const ipo = await this.#prisma.iPO.create({
      data: {
        gameId: input.gameId,
        companyId: input.companyId,
        targetGrade: input.targetGrade,
        ipoPrice,
        ipoShares: 1000 + Math.floor(Math.random() * 4000),
        announcedAtTurn: input.announcedAtTurn,
        ipoAtTurn: input.ipoAtTurn,
      },
      include: { company: true },
    });

    await this.#newsService.createIpoAnnounceNews({
      gameId: input.gameId,
      gameStep: input.announcedAtTurn,
      ticker: company.ticker,
      companyName: company.name,
      ipoPrice,
      ipoAtTurn: input.ipoAtTurn,
    });

    return ipo;
  }

  async listActive(gameId: string) {
    return this.#prisma.iPO.findMany({
      where: { gameId, isCompleted: false },
      include: {
        company: true,
        subscriptions: true,
      },
      orderBy: { ipoAtTurn: 'asc' },
    });
  }

  async listHistory(gameId: string) {
    return this.#prisma.iPO.findMany({
      where: { gameId, isCompleted: true },
      include: { company: true },
      orderBy: { ipoAtTurn: 'desc' },
      take: 20,
    });
  }

  async subscribeToIPO(
    gameId: string,
    ipoId: string,
    character: { id: string; balance: number; bankingLevel: number; reputation: number },
    amount: number,
  ) {
    if (!Number.isInteger(amount) || amount < 1) {
      throw new AppError(400, 'INVALID_AMOUNT', 'Subscription amount must be a positive integer');
    }

    const ipo = await this.#prisma.iPO.findFirst({
      where: { id: ipoId, gameId, isCompleted: false },
    });

    if (!ipo) {
      throw new AppError(404, 'IPO_NOT_FOUND', 'IPO not found');
    }

    if (amount < ipo.minSubscription || amount > ipo.maxSubscription) {
      throw new AppError(400, 'IPO_AMOUNT_OUT_OF_RANGE', 'Subscription amount out of allowed range');
    }

    const gradeConfig = STOCK_GRADE_CONFIG[ipo.targetGrade];
    if (character.bankingLevel < gradeConfig.minBankingLevel) {
      throw new AppError(400, 'BANKING_LEVEL_TOO_LOW', 'Banking level too low for this IPO');
    }

    const totalCost = amount * ipo.ipoPrice;
    if (character.balance < totalCost) {
      throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance for IPO subscription');
    }

    await this.#prisma.$transaction(async (tx) => {
      await tx.iPOSubscription.upsert({
        where: { ipoId_playerId: { ipoId, playerId: character.id } },
        create: { ipoId, playerId: character.id, amount },
        update: { amount },
      });

      await tx.character.update({
        where: { id: character.id },
        data: {
          balance: { decrement: totalCost },
          totalSpent: { increment: totalCost },
        },
      });
    });

    return this.listActive(gameId);
  }

  async executeIPO(ipoId: string) {
    const ipo = await this.#prisma.iPO.findUniqueOrThrow({
      where: { id: ipoId },
      include: { company: true, subscriptions: true },
    });

    if (ipo.isCompleted) return ipo;

    await this.#prisma.$transaction(async (tx) => {
      await tx.gameStockListing.updateMany({
        where: { gameId: ipo.gameId, companyId: ipo.companyId },
        data: {
          grade: ipo.targetGrade,
          currentPrice: ipo.ipoPrice,
          previousPrice: ipo.ipoPrice,
          dayChange: 0,
          availableOnExchange: STOCK_GRADE_CONFIG[ipo.targetGrade].availableOnExchange,
        },
      });

      for (const sub of ipo.subscriptions) {
        const existing = await tx.stock.findFirst({
          where: { ownerId: sub.playerId, companyId: ipo.companyId, gameId: ipo.gameId },
        });

        if (existing) {
          const nextQty = existing.quantity + sub.amount;
          const nextPrice =
            (existing.purchasePrice * existing.quantity + ipo.ipoPrice * sub.amount) / nextQty;
          await tx.stock.update({
            where: { id: existing.id },
            data: { quantity: nextQty, purchasePrice: nextPrice },
          });
        } else {
          await tx.stock.create({
            data: {
              ownerId: sub.playerId,
              companyId: ipo.companyId,
              gameId: ipo.gameId,
              purchasePrice: ipo.ipoPrice,
              quantity: sub.amount,
            },
          });
        }
      }

      await tx.iPO.update({
        where: { id: ipoId },
        data: { isCompleted: true },
      });
    });

    await this.#newsService.createIpoCompleteNews({
      gameId: ipo.gameId,
      gameStep: ipo.ipoAtTurn,
      ticker: ipo.company.ticker,
      companyName: ipo.company.name,
      ipoPrice: ipo.ipoPrice,
    });

    return this.#prisma.iPO.findUniqueOrThrow({
      where: { id: ipoId },
      include: { company: true },
    });
  }

  async createNewCompany(gameId: string, turn: number) {
    const listedCompanyIds = new Set(
      (
        await this.#prisma.gameStockListing.findMany({
          where: { gameId },
          select: { companyId: true },
        })
      ).map((row) => row.companyId),
    );

    const candidate = COMPANIES.find((company) => {
      return !listedCompanyIds.has(company.ticker);
    });

    if (!candidate) return null;

    const dbCompany = await ensureCompanyByTicker(this.#prisma, candidate.ticker);
    const grade = targetGradeForTurn(turn);
    const price = randomPriceInGradeRange(grade);

    const listing = await this.#prisma.gameStockListing.create({
      data: {
        gameId,
        companyId: dbCompany.id,
        grade,
        currentPrice: price,
        previousPrice: price,
        dayChange: 0,
        availableOnExchange: false,
      },
    });

    await this.#prisma.priceHistory.createMany({
      data: buildWarmupHistoryRecords({
        gameId,
        companyId: dbCompany.id,
        listingId: listing.id,
        ticker: candidate.ticker,
        grade,
        currentPrice: price,
      }),
    });

    return dbCompany;
  }
}
