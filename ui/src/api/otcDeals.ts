import { http } from '../lib/http';
import type { GeneratedNewsItem, OtcDealPayload } from './gameTurn';
import type { Game } from './types';

export interface AcceptOtcDealResponse {
  balance: number;
  character: NonNullable<Game['character']>;
  news: GeneratedNewsItem;
}

export async function acceptOtcDeal(gameId: string, deal: OtcDealPayload) {
  return http
    .post(`saves/${gameId}/otc-deals/accept`, { json: { deal } })
    .json<AcceptOtcDealResponse>();
}
