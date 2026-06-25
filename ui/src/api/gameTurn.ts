import { http } from '../lib/http';
import type { NextTurnForecast } from '../pages/game_dashboard/_components/next_turn_forecast';
import type { Game } from './types';

export interface GeneratedNewsItem {
  id: string;
  kind: 'WELCOME' | 'MARKET' | 'INSIDER' | 'RUMOR' | 'OTC_DEAL' | 'PROPERTY_OFFER';
  title: string;
  body: string;
  excerpt: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  impact: number;
  ticker?: string;
  hot?: boolean;
  publishedAt: string;
  payload?: unknown;
}

export interface OtcDealPayload {
  botName: string;
  ticker: string;
  companyName: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  turnsLeft: number;
  flavorText: string;
}

export interface EndTurnResponse {
  step: number;
  balance: number;
  character: NonNullable<Game['character']>;
  nextTurnForecast: NextTurnForecast;
  passiveIncome: {
    salary: number;
    livingExpense: number;
    installmentTotal: number;
    passiveIncome: number;
    itemsPaidOff: string[];
    netChange: number;
  };
  insiderChancePercent: number;
  insiderRolled: boolean;
  news: GeneratedNewsItem[];
  otcDeal?: OtcDealPayload;
  propertyOffer?: unknown;
}

export interface GameDashboardResponse {
  game: NonNullable<Game>;
  news: GeneratedNewsItem[];
  nextTurnForecast: NextTurnForecast;
}

export async function fetchGameDashboard(gameId: string) {
  return http.get(`saves/${gameId}/dashboard`).json<GameDashboardResponse>();
}

const inflightEndTurns = new Map<string, Promise<EndTurnResponse>>();

export function endGameTurn(gameId: string, expectedStep: number) {
  const inflight = inflightEndTurns.get(gameId);
  if (inflight) return inflight;

  const request = http
    .post(`saves/${gameId}/end-turn`, { json: { expectedStep } })
    .json<EndTurnResponse>()
    .finally(() => {
      if (inflightEndTurns.get(gameId) === request) {
        inflightEndTurns.delete(gameId);
      }
    });

  inflightEndTurns.set(gameId, request);
  return request;
}

export async function fetchGameNews(gameId: string) {
  return http.get(`saves/${gameId}/news`).json<{ news: GeneratedNewsItem[] }>();
}

export async function fetchNextTurnForecast(gameId: string) {
  return http.get(`saves/${gameId}/next-turn-forecast`).json<NextTurnForecast>();
}

export async function fetchGame(gameId: string) {
  return http.get(`saves/${gameId}`).json<Game>();
}

export function mapApiNewsToFeedItem(item: GeneratedNewsItem, index: number) {
  const sentiment =
    item.sentiment === 'POSITIVE'
      ? 'positive'
      : item.sentiment === 'NEGATIVE'
        ? 'negative'
        : 'neutral';

  return {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt || item.body,
    timeLabel: index === 0 ? 'только что' : 'в этом ходу',
    kind: item.kind,
    hot: item.hot ?? item.kind === 'INSIDER',
    sentiment: sentiment as 'positive' | 'negative' | 'neutral',
  };
}

export function mapOtcDealToCard(deal: OtcDealPayload, id: string) {
  return {
    id,
    botName: deal.botName,
    ticker: deal.ticker,
    companyName: deal.companyName,
    side: deal.side,
    qty: deal.qty,
    price: deal.price,
    turnsLeft: deal.turnsLeft,
  };
}
