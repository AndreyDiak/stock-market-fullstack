import { http } from '../lib/http';
import type { Game } from './types';
import type { PropertyOffer } from '../pages/game_dashboard/_model/types';

export type NegotiateAdjustmentPercent = number;

export interface NegotiateDealResult {
  assetId: string;
  itemName: string;
  type: PropertyOffer['type'];
  price: number;
  action: 'purchased' | 'sold';
}

export interface InstallmentSaleBreakdown {
  paidTotal: number;
  remainingTotal: number;
  saleProceeds: number;
  netProfit: number;
}

export interface AcceptPropertyOfferResponse {
  balance: number;
  previousBalance: number;
  previousReputation: number;
  reputation: number;
  profitAmount: number;
  installmentBreakdown: InstallmentSaleBreakdown | null;
  deal: NegotiateDealResult;
  character: NonNullable<Game['character']>;
  propertyOffers: PropertyOffer[];
}

export interface NegotiatePropertyOfferResponse {
  success: boolean;
  d20: number;
  roll: number;
  target: number;
  negotiatedPrice: number | null;
  deal: NegotiateDealResult | null;
  previousReputation: number;
  reputation: number;
  previousBalance: number;
  balance: number;
  propertyOffers: PropertyOffer[];
  character: NonNullable<Game['character']>;
}

export async function acceptPropertyOffer(gameId: string, offerId: string) {
  return http
    .post(`saves/${gameId}/property-offers/${offerId}/accept`)
    .json<AcceptPropertyOfferResponse>();
}

export async function negotiatePropertyOffer(
  gameId: string,
  offerId: string,
  adjustmentPercent: number,
) {
  return http
    .post(`saves/${gameId}/property-offers/${offerId}/negotiate`, {
      json: { adjustmentPercent },
    })
    .json<NegotiatePropertyOfferResponse>();
}
