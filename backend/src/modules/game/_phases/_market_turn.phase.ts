import type { MarketService } from '../../market/market.service.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Ежehodовое обновление рынка: sentiment, sector momentum, news pressure decay, цены */
export class MarketTurnPhase implements TurnPhase {
  readonly id = 'market-turn';
  readonly #marketService: MarketService;

  constructor(marketService: MarketService) {
    this.#marketService = marketService;
  }

  async execute(context: TurnContext, _state: TurnState): Promise<void> {
    await this.#marketService.processTurn(context.gameId, context.game.step);
  }
}
