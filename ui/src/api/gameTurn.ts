import { http } from '../lib/http';

export interface GeneratedNewsItem {
  id: string;
  kind: 'MARKET' | 'INSIDER' | 'RUMOR' | 'OTC_DEAL' | 'PROPERTY_OFFER';
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
  passiveIncome: {
    salary: number;
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

export async function endGameTurn(gameId: string) {
  return http.post(`games/${gameId}/end-turn`).json<EndTurnResponse>();
}

export async function fetchGameNews(gameId: string) {
  return http.get(`games/${gameId}/news`).json<{ news: GeneratedNewsItem[] }>();
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
