import type { PriceImpactService } from '../../market/price_impact.service.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Применяет отложенные движения цен, запланированные инсайдерскими новостями */
export class PriceImpactPhase implements TurnPhase {
  readonly id = 'price-impact';
  readonly #priceImpactService: PriceImpactService;

  constructor(priceImpactService: PriceImpactService) {
    this.#priceImpactService = priceImpactService;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    state.appliedPriceImpacts = await this.#priceImpactService.applyDueImpacts(
      context.gameId,
      context.game.step,
    );
  }
}
