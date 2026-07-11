import type { PrismaClient } from '@prisma/client';
import type { MarketService } from '../../market/market.service.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Ежehodовое обновление рынка: sentiment, sector momentum, news pressure decay, цены, дивиденды */
export class MarketTurnPhase implements TurnPhase {
  readonly id = 'market-turn';
  readonly #marketService: MarketService;
  readonly #prisma: PrismaClient;

  constructor(marketService: MarketService, prisma: PrismaClient) {
    this.#marketService = marketService;
    this.#prisma = prisma;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    const result = await this.#marketService.processTurn(
      context.gameId,
      context.game.step,
      context.game.character.id,
    );

    state.dividendPayouts = result.dividendPayouts;
    state.news.push(...result.dividendNews);

    const dividendTotal = result.dividendPayouts.reduce((sum, payout) => sum + payout.totalPaid, 0);
    if (dividendTotal > 0) {
      context.game.character.balance += dividendTotal;
      await this.#prisma.character.update({
        where: { id: context.game.character.id },
        data: { balance: { increment: dividendTotal } },
      });
    }
  }
}
