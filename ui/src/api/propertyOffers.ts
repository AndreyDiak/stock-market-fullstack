import { http } from '../lib/http';
import type { Game } from './types';
import type { GeneratedNewsItem } from './gameTurn';
import type { NextTurnForecast } from '../pages/game_dashboard/_components/sidebar/_next_turn_forecast';
import type { PropertyOffer } from '../pages/game_dashboard/_model/types';
export type NegotiateAdjustmentPercent = number;

export type PropertyOfferPaymentMode = 'full' | 'installment';

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
  purchasePrice: number;
  priceDelta: number;
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
  news: GeneratedNewsItem;
  nextTurnForecast: NextTurnForecast;
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
  news: GeneratedNewsItem | null;
}

export async function acceptPropertyOffer(
  gameId: string,
  offerId: string,
  paymentMode: PropertyOfferPaymentMode = 'installment',
) {
  return http
    .post(`saves/${gameId}/property-offers/${offerId}/accept`, {
      json: { paymentMode },
    })
    .json<AcceptPropertyOfferResponse>();
}

export async function negotiatePropertyOffer(
  gameId: string,
  offerId: string,
  adjustmentPercent: number,
) {
  const normalizedPercent = Math.round(adjustmentPercent);
  return http
    .post(`saves/${gameId}/property-offers/${offerId}/negotiate`, {
      json: { adjustmentPercent: normalizedPercent },
    })
    .json<NegotiatePropertyOfferResponse>();
}

export async function acceptNegotiatedPropertyOffer(
  gameId: string,
  offerId: string,
  paymentMode: PropertyOfferPaymentMode = 'installment',
) {
  return http
    .post(`saves/${gameId}/property-offers/${offerId}/negotiate/accept`, {
      json: { paymentMode },
    })
    .json<AcceptPropertyOfferResponse>();
}

export async function declineNegotiatedPropertyOffer(gameId: string, offerId: string) {
  return http
    .post(`saves/${gameId}/property-offers/${offerId}/negotiate/decline`)
    .json<{ propertyOffers: PropertyOffer[] }>();
}
