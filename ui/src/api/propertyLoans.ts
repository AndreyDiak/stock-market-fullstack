import { http } from '../lib/http';
import type { NextTurnForecast } from '../pages/game_dashboard/_components/sidebar/_next_turn_forecast';
import type { Game } from './types';
import type { GeneratedNewsItem } from './gameTurn';

export interface PayOffInstallmentResponse {
  balance: number;
  previousBalance: number;
  character: NonNullable<Game['character']>;
  news: GeneratedNewsItem;
  nextTurnForecast: NextTurnForecast;
}

export async function payOffInstallment(gameId: string, itemId: string, payPercent: number) {
  return http
    .post(`saves/${gameId}/inventory/${itemId}/pay-off-installment`, {
      json: { payPercent },
    })
    .json<PayOffInstallmentResponse>();
}
