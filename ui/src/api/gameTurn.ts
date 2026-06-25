import { http } from '../lib/http';
import type { NextTurnForecast } from '../pages/game_dashboard/_components/next_turn_forecast';
import { format_news_age_label, resolve_published_step } from '../pages/game_dashboard/_model/utils';
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
  publishedStep?: number;
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

export interface InsiderNewsPayload {
  turnsUntilImpact?: number
  expectedMovePercent?: number
  scheduledImpact?: {
    turnsUntilImpact: number
    triggerAtStep: number
    direction: 'UP' | 'DOWN'
    movePercent: number
    scheduledImpactId?: string
  }
}

export function mapApiNewsToFeedItem(
  item: GeneratedNewsItem,
  _index: number,
  currentStep?: number,
) {
  const sentiment =
    item.sentiment === 'POSITIVE'
      ? 'positive'
      : item.sentiment === 'NEGATIVE'
        ? 'negative'
        : 'neutral';

  const payload = item.payload as InsiderNewsPayload | undefined
  const publishedStep = resolve_published_step(item)
  const triggerAtStep = payload?.scheduledImpact?.triggerAtStep
  const turnsLeft =
    triggerAtStep != null && currentStep != null
      ? Math.max(0, triggerAtStep - currentStep)
      : undefined

  return {
    id: item.id,
    title: item.title,
    body: item.body,
    excerpt: item.excerpt || item.body,
    timeLabel:
      currentStep != null
        ? format_news_age_label(publishedStep, currentStep)
        : '—',
    kind: item.kind,
    hot: item.hot ?? item.kind === 'INSIDER',
    sentiment: sentiment as 'positive' | 'negative' | 'neutral',
    ticker: item.ticker,
    publishedAt: item.publishedAt,
    publishedStep,
    payload: item.payload,
    turnsLeft: turnsLeft && turnsLeft > 0 ? turnsLeft : undefined,
  };
}

export function mapApiNewsList(items: GeneratedNewsItem[], currentStep: number) {
  return [...items]
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .map((item, index) => mapApiNewsToFeedItem(item, index, currentStep))
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
