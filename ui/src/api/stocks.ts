import { http } from '../lib/http';
import type { GeneratedNewsItem } from './gameTurn';
import type { portfolio_row, profit_grade } from '../pages/game_dashboard/_model/types';

export interface StockListing {
  id: string;
  companyId: string;
  ticker: string;
  name: string;
  sector: string;
  grade: profit_grade;
  currentPrice: number;
  previousPrice: number;
  dayChange: number;
  availableOnExchange: boolean;
  isLocked: boolean;
  hasInsiderPressure: boolean;
  hasNewsPressure: boolean;
  archetype: 'growth' | 'dividend' | 'speculative' | 'defensive' | null;
  archetypeLabel: string | null;
  paysDividends: boolean;
  turnsUntilDividend: number | null;
  history?: PriceHistoryPoint[];
}

export interface PriceHistoryPoint {
  turn: number;
  price: number;
}

export interface MarketSentiment {
  value: number;
  indicator: 'bearish' | 'neutral' | 'bullish';
}

export interface SectorMomentum {
  sector: string;
  value: number;
  duration: number;
  trend: 'rising' | 'falling' | 'neutral';
}

export interface IpoListing {
  id: string;
  companyId: string;
  ticker: string;
  companyName: string;
  targetGrade: profit_grade;
  ipoPrice: number;
  ipoShares: number;
  announcedAtTurn: number;
  ipoAtTurn: number;
  minSubscription: number;
  maxSubscription: number;
  isCompleted: boolean;
  totalSubscribed?: number;
}

export interface PortfolioRow extends portfolio_row {
  purchasePrice: number;
  pnl: number;
  listingId: string;
  turnsHeldInCycle: number;
}

export function mapApiStockListing(row: StockListing): StockListing {
  return row;
}

export function mapApiPortfolioRow(row: PortfolioRow): portfolio_row {
  return {
    ticker: row.ticker,
    name: row.name,
    qty: row.qty,
    price: row.price,
    purchasePrice: row.purchasePrice,
    changePct: row.changePct,
    paysDividends: row.paysDividends,
    turnsUntilDividend: row.turnsUntilDividend,
    listingId: row.listingId,
    turnsHeldInCycle: row.turnsHeldInCycle,
    pnl: row.pnl,
  };
}

export async function fetchStockListings(gameId: string) {
  const data = await http.get(`saves/${gameId}/stocks`).json<{ stocks: StockListing[] }>();
  return data.stocks;
}

export async function fetchStockDetail(gameId: string, listingId: string) {
  return http.get(`saves/${gameId}/stocks/${listingId}`).json<{
    listing: StockListing;
    history: PriceHistoryPoint[];
  }>();
}

export async function fetchStockHistory(gameId: string, listingId: string, limit = 20) {
  return http
    .get(`saves/${gameId}/stocks/${listingId}/history`, { searchParams: { limit } })
    .json<{ history: PriceHistoryPoint[] }>();
}

export async function buyStock(gameId: string, listingId: string, quantity: number) {
  return http
    .post(`saves/${gameId}/stocks/${listingId}/buy`, { json: { quantity } })
    .json<{ balance: number; portfolio: PortfolioRow[]; news: GeneratedNewsItem }>();
}

export interface StockTrade {
  id: string;
  ticker: string;
  companyName: string;
  sector: string;
  operationType: string;
  quantity: number;
  price: number;
  total: number;
  netTotal: number | null;
  commission: number | null;
  turn: number;
  createdAt: string;
}

export async function sellStock(gameId: string, listingId: string, quantity: number) {
  return http
    .post(`saves/${gameId}/stocks/${listingId}/sell`, { json: { quantity } })
    .json<{
      balance: number;
      portfolio: PortfolioRow[];
      gross: number;
      commissionPercent: number;
      commissionAmount: number;
      net: number;
    }>();
}

export async function fetchTradeHistory(gameId: string) {
  return http.get(`saves/${gameId}/stocks/trades`).json<{ trades: StockTrade[] }>();
}

export async function fetchPortfolio(gameId: string) {
  return http.get(`saves/${gameId}/portfolio`).json<{ portfolio: PortfolioRow[] }>();
}

export async function subscribeToIpo(gameId: string, ipoId: string, amount: number) {
  return http
    .post(`saves/${gameId}/ipo/${ipoId}/subscribe`, { json: { amount } })
    .json<{ ipos: IpoListing[] }>();
}
