import { http } from '../lib/http';
import type { GeneratedNewsItem } from './gameTurn';
import type { Game } from './types';

export interface AcceptDealResponse {
  balance: number;
  previousBalance: number;
  character: NonNullable<Game['character']>;
  news: GeneratedNewsItem;
}

export async function acceptDeal(gameId: string, dealId: string) {
  return http
    .post(`saves/${gameId}/deals/accept`, { json: { dealId } })
    .json<AcceptDealResponse>();
}
