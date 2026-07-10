import { REAL_ESTATE, type RealEstateData } from '../../assets/real_estate.js';
import type { PlayerPropertyRef } from './deal.types.js';

/** Явные цепочки апгрейда: роскошь ← более дешёвая недвижимость. */
export const LUXURY_TRADE_UP_PREREQUISITES: Record<string, string> = {
  combine_harvester: 'tractor',
  sport_car: 'car',
  yacht: 'sport_car',
  car_wash: 'trade_pavilion',
  penthouse: 'apartment',
  apartment: 'country_house',
  warehouse: 'trade_pavilion',
};

export function getLuxuryPrerequisite(luxuryPropertyId: string): string | null {
  return LUXURY_TRADE_UP_PREREQUISITES[luxuryPropertyId] ?? null;
}

export interface CheaperPropertyPickContext {
  luxury: RealEstateData;
  dreamItemIds: Set<string>;
  ownedProperties: PlayerPropertyRef[];
}

function findTradableProperty(propertyId: string): RealEstateData | null {
  const property = REAL_ESTATE.find((item) => item.id === propertyId);
  if (!property?.isTradable) return null;
  return property;
}

/** Подбирает более дешёвую недвижимость, которую бот может запросить у игрока в сделке. */
export function pickCheaperPropertyForLuxuryDeal(ctx: CheaperPropertyPickContext): RealEstateData | null {
  const { luxury } = ctx;
  const minCollateral = Math.max(1_500, Math.round(luxury.basePrice * 0.08));
  const maxCollateral = Math.round(luxury.basePrice * 0.6);

  const prerequisiteId = getLuxuryPrerequisite(luxury.id);
  if (prerequisiteId) {
    const prerequisite = findTradableProperty(prerequisiteId);
    if (
      prerequisite
      && prerequisite.basePrice < luxury.basePrice
      && prerequisite.basePrice >= minCollateral
      && prerequisite.basePrice <= maxCollateral
    ) {
      return prerequisite;
    }
  }

  const ownedCheaper = ctx.ownedProperties
    .map((owned) => findTradableProperty(owned.propertyId))
    .filter((property): property is RealEstateData => !!property
      && property.id !== luxury.id
      && property.basePrice < luxury.basePrice
      && property.basePrice >= minCollateral
      && property.basePrice <= maxCollateral)
    .sort((a, b) => b.basePrice - a.basePrice);
  if (ownedCheaper.length > 0) {
    return ownedCheaper[0]!;
  }

  const dreamCheaper = REAL_ESTATE.filter((property) => property.isTradable
    && ctx.dreamItemIds.has(property.id)
    && property.id !== luxury.id
    && property.basePrice < luxury.basePrice
    && property.basePrice >= minCollateral
    && property.basePrice <= maxCollateral)
    .sort((a, b) => b.basePrice - a.basePrice);
  if (dreamCheaper.length > 0) {
    return dreamCheaper[0]!;
  }

  const genericCheaper = REAL_ESTATE.filter((property) => property.isTradable
    && property.id !== luxury.id
    && property.basePrice >= minCollateral
    && property.basePrice <= maxCollateral)
    .sort((a, b) => b.basePrice - a.basePrice);
  if (genericCheaper.length > 0) {
    return genericCheaper[0]!;
  }

  return null;
}
