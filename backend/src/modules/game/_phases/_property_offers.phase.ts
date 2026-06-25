import type { PropertyOfferGenerator } from '../_generators/_property_offer.generator.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Предложения купить/продать имущество */
export class PropertyOffersPhase implements TurnPhase {
  readonly id = 'property-offers';
  readonly #generator: PropertyOfferGenerator;

  constructor(generator: PropertyOfferGenerator) {
    this.#generator = generator;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    state.propertyOffer = await this.#generator.maybeGenerate({
      gameStep: context.game.step,
    });
  }
}
