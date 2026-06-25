import type { OtcDealGenerator } from '../_generators/_otc_deal.generator.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Личные OTC-предложения от ботов */
export class OtcDealsPhase implements TurnPhase {
  readonly id = 'otc-deals';
  readonly #generator: OtcDealGenerator;

  constructor(generator: OtcDealGenerator) {
    this.#generator = generator;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    state.otcDeal = await this.#generator.maybeGenerate({
      gameStep: context.game.step,
      playerPortfolioTickers: context.playerPortfolioTickers,
    });
  }
}
