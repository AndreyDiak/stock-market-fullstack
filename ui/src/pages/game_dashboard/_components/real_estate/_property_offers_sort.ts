import type { PropertyOffer } from '../../_model/types';

export function sortPropertyOffersByTtl(offers: PropertyOffer[]): PropertyOffer[] {
  return [...offers].sort((a, b) => a.expiresInTurns - b.expiresInTurns);
}
