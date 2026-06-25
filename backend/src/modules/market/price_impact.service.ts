import type { PrismaClient, ScheduledPriceImpact } from '@prisma/client';
import { GameCompanyQuoteService } from './game_company_quote.service.js';

export interface AppliedPriceImpact {
  impactId: string;
  ticker: string;
  direction: 'UP' | 'DOWN';
  movePercent: number;
  previousPrice: number;
  newPrice: number;
  triggerAtStep: number;
}

export class PriceImpactService {
  readonly #quoteService: GameCompanyQuoteService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#quoteService = new GameCompanyQuoteService(prisma);
  }

  async applyDueImpacts(gameId: string, currentStep: number): Promise<AppliedPriceImpact[]> {
    const due = await this.#prisma.scheduledPriceImpact.findMany({
      where: {
        gameId,
        status: 'PENDING',
        triggerAtStep: { lte: currentStep },
      },
      include: { company: true },
      orderBy: { triggerAtStep: 'asc' },
    });

    const applied: AppliedPriceImpact[] = [];

    for (const impact of due) {
      const result = await this.#applyOne(gameId, currentStep, impact);
      applied.push(result);
    }

    return applied;
  }

  async #applyOne(
    gameId: string,
    currentStep: number,
    impact: ScheduledPriceImpact & { company: { ticker: string } },
  ): Promise<AppliedPriceImpact> {
    const quote = await this.#quoteService.ensureQuote(gameId, impact.company.ticker);
    const multiplier =
      impact.direction === 'UP'
        ? 1 + impact.movePercent / 100
        : 1 - impact.movePercent / 100;
    const previousPrice = quote.currentPrice;
    const newPrice = Math.max(1, Number((previousPrice * multiplier).toFixed(2)));

    await this.#prisma.$transaction([
      this.#prisma.gameCompanyQuote.update({
        where: { id: quote.id },
        data: { currentPrice: newPrice },
      }),
      this.#prisma.scheduledPriceImpact.update({
        where: { id: impact.id },
        data: { status: 'APPLIED', appliedAtStep: currentStep },
      }),
      this.#prisma.priceHistory.create({
        data: {
          companyId: impact.companyId,
          gameId,
          price: newPrice,
        },
      }),
    ]);

    return {
      impactId: impact.id,
      ticker: impact.company.ticker,
      direction: impact.direction,
      movePercent: impact.movePercent,
      previousPrice,
      newPrice,
      triggerAtStep: impact.triggerAtStep,
    };
  }
}
