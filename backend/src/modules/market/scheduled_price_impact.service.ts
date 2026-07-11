import type { PriceDirection, PrismaClient } from '@prisma/client';
import { ensureCompanyByTicker } from './company_catalog.js';

export interface SchedulePriceImpactInput {
  gameId: string;
  ticker: string;
  newsId?: string;
  direction: PriceDirection;
  movePercent: number;
  createdAtStep: number;
  turnsUntilImpact: number;
}

export class ScheduledPriceImpactService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async schedule(input: SchedulePriceImpactInput) {
    const company = await ensureCompanyByTicker(this.#prisma, input.ticker);
    const movePercent = Math.max(1, Math.min(50, Math.abs(input.movePercent)));
    const turnsUntilImpact = Math.max(1, Math.min(10, Math.round(input.turnsUntilImpact)));
    const triggerAtStep = input.createdAtStep + turnsUntilImpact;

    return this.#prisma.scheduledPriceImpact.create({
      data: {
        gameId: input.gameId,
        companyId: company.id,
        newsId: input.newsId,
        direction: input.direction,
        movePercent,
        createdAtStep: input.createdAtStep,
        triggerAtStep,
      },
      include: { company: true },
    });
  }

  async listPending(gameId: string) {
    return this.#prisma.scheduledPriceImpact.findMany({
      where: { gameId, status: 'PENDING' },
      include: { company: true },
      orderBy: { triggerAtStep: 'asc' },
    });
  }
}
