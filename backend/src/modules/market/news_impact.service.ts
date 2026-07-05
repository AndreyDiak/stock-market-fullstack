import type { MarketSector, PrismaClient, Sentiment } from '@prisma/client';
import type { StockGrade } from '../../assets/stock_grade.js';
import { shiftSentiment } from './market_sentiment.engine.js';
import { shiftSectorMomentum, getSectorTrend } from './sector_momentum.engine.js';

export interface NewsImpactInput {
  id: string;
  gameId: string;
  kind: string;
  impact: number;
  sentiment: Sentiment;
  sector?: MarketSector | null;
  companyId?: string | null;
}

export class NewsImpactService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async applyNews(news: NewsImpactInput): Promise<void> {
    if (news.kind === 'INSIDER') return;

    if (news.kind === 'MARKET' || news.kind === 'RUMOR') {
      const strength = news.kind === 'RUMOR' ? 0.6 : 1;
      const signedImpact = this.#signedImpact(news);

      if (news.sector) {
        await this.#applySectorNews(news.gameId, news.id, news.sector, signedImpact * strength);
        return;
      }

      if (news.companyId) {
        await this.#applyCompanyNews(news.gameId, news.id, news.companyId, signedImpact * strength);
        return;
      }

      if (Math.abs(news.impact) > 0.5) {
        await this.#applyMarketWideNews(news.gameId, news.id, signedImpact * strength * 0.5);
      }
    }
  }

  async createInsiderPressure(input: {
    gameId: string;
    newsId: string;
    ticker: string;
    direction: 'UP' | 'DOWN';
    movePercent: number;
    remainingTurns: number;
  }) {
    const listing = await this.#findListingByTicker(input.gameId, input.ticker);
    if (!listing) return null;

    const sign = input.direction === 'UP' ? 1 : -1;
    const impact = sign * Math.max(0.5, input.movePercent / 8);

    return this.#prisma.newsPressure.create({
      data: {
        gameId: input.gameId,
        newsId: input.newsId,
        stockListingId: listing.id,
        impact,
        remainingTurns: Math.max(3, Math.min(7, input.remainingTurns)),
        decayRate: 0.15,
      },
    });
  }

  async #applySectorNews(
    gameId: string,
    newsId: string,
    sector: MarketSector,
    impact: number,
  ) {
    const delta = impact * 0.12;
    await this.#shiftSector(gameId, sector, delta);

    const listings = await this.#prisma.gameStockListing.findMany({
      where: { gameId, company: { sector } },
      select: { id: true },
    });

    await this.#createPressures(
      gameId,
      newsId,
      listings.map((listing) => listing.id),
      impact * 0.35,
    );
  }

  async #applyCompanyNews(
    gameId: string,
    newsId: string,
    companyId: string,
    impact: number,
  ) {
    const listing = await this.#prisma.gameStockListing.findUnique({
      where: { gameId_companyId: { gameId, companyId } },
      select: { id: true },
    });
    if (!listing) return;

    await this.#createPressures(gameId, newsId, [listing.id], impact * 0.5);
  }

  async #applyMarketWideNews(gameId: string, newsId: string, impact: number) {
    await this.#shiftSentiment(gameId, impact * 0.15);

    const listings = await this.#prisma.gameStockListing.findMany({
      where: { gameId },
      select: { id: true },
    });

    await this.#createPressures(
      gameId,
      newsId,
      listings.map((listing) => listing.id),
      impact * 0.08,
    );
  }

  async #shiftSentiment(gameId: string, delta: number) {
    const row = await this.#prisma.marketSentiment.findUnique({ where: { gameId } });
    const next = shiftSentiment(row?.value ?? 0, delta);
    await this.#prisma.marketSentiment.upsert({
      where: { gameId },
      create: { gameId, value: next },
      update: { value: next },
    });
  }

  async #shiftSector(gameId: string, sector: MarketSector, delta: number) {
    const row = await this.#prisma.sectorMomentum.findUnique({
      where: { gameId_sector: { gameId, sector } },
    });
    const nextValue = shiftSectorMomentum(row?.value ?? 0, delta);
    const trend = getSectorTrend(nextValue);
    await this.#prisma.sectorMomentum.upsert({
      where: { gameId_sector: { gameId, sector } },
      create: {
        gameId,
        sector,
        value: nextValue,
        duration: 3,
        trend,
      },
      update: {
        value: nextValue,
        duration: Math.max(row?.duration ?? 0, 3),
        trend,
      },
    });
  }

  async #createPressures(
    gameId: string,
    newsId: string,
    listingIds: string[],
    impact: number,
  ) {
    if (listingIds.length === 0 || Math.abs(impact) < 0.01) return;

    await this.#prisma.newsPressure.createMany({
      data: listingIds.map((stockListingId) => ({
        gameId,
        newsId,
        stockListingId,
        impact,
        remainingTurns: 2,
        decayRate: 0.2,
      })),
    });
  }

  async #findListingByTicker(gameId: string, ticker: string) {
    return this.#prisma.gameStockListing.findFirst({
      where: { gameId, company: { ticker } },
      select: { id: true, grade: true },
    });
  }

  #signedImpact(news: NewsImpactInput): number {
    const magnitude = Math.abs(news.impact);
    if (news.sentiment === 'POSITIVE') return magnitude;
    if (news.sentiment === 'NEGATIVE') return -magnitude;
    return news.impact;
  }
}

export type { StockGrade };
