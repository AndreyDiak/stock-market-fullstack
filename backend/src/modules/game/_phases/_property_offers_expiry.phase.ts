import type { PropertyOffersService } from '../../property_offers/property_offers.service.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Деактивация истёкших предложений недвижимости */
export class PropertyOffersExpiryPhase implements TurnPhase {
  readonly id = 'property-offers-expiry';
  readonly #service: PropertyOffersService;

  constructor(service: PropertyOffersService) {
    this.#service = service;
  }

  async execute(context: TurnContext, _state: TurnState): Promise<void> {
    await this.#service.expireOffers(context.gameId, context.game.step);
  }
}
