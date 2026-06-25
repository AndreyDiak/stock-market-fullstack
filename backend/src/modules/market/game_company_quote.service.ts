import type { PrismaClient } from '@prisma/client';
import { defaultPriceForTicker, ensureCompanyByTicker } from './company_catalog.js';

export class GameCompanyQuoteService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async ensureQuote(gameId: string, ticker: string) {
    const company = await ensureCompanyByTicker(this.#prisma, ticker);
    const basePrice = company.currentPrice > 0 ? company.currentPrice : defaultPriceForTicker(ticker);

    return this.#prisma.gameCompanyQuote.upsert({
      where: {
        gameId_companyId: { gameId, companyId: company.id },
      },
      create: {
        gameId,
        companyId: company.id,
        currentPrice: basePrice,
      },
      update: {},
      include: { company: true },
    });
  }

  async updatePrice(gameId: string, companyId: string, newPrice: number) {
    return this.#prisma.gameCompanyQuote.update({
      where: {
        gameId_companyId: { gameId, companyId },
      },
      data: { currentPrice: Math.max(1, newPrice) },
    });
  }
}
