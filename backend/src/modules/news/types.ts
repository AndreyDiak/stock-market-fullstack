import type { MarketSector, Sentiment } from '@prisma/client';

export type GeneratedNewsKind =
  | 'WELCOME'
  | 'MARKET'
  | 'INSIDER'
  | 'RUMOR'
  | 'OTC_DEAL'
  | 'PROPERTY_OFFER';

export interface NewsContext {
  sector: string;
  companies: string[];
  marketCondition: string;
  newsType: 'положительная' | 'отрицательная' | 'нейтральная';
  impactStrength: number;
  style?: string;
  length?: string;
  tone?: string;
}

export interface HealthcareNewsContext {
  company: { name: string; ticker: string };
  eventType: string;
  outcome: string;
  accessLevel: 'базовый' | 'продвинутый' | 'инсайдерский';
}

export interface RumorContext {
  sector: string;
  reliability: number;
  company: string;
}

export interface InsiderNewsContext {
  company: { name: string; ticker: string; sector: MarketSector };
  professionLevel: number;
  accessChancePercent: number;
  currentPrice?: number;
  turnsUntilImpact: number;
}

export interface OtcDealGenerationContext {
  botName: string;
  botProfession: string;
  company: { name: string; ticker: string };
  playerPortfolioTickers: string[];
  gameStep: number;
}

export interface PropertyOfferContext {
  botName: string;
  itemName: string;
  itemRef: string;
  side: 'buy' | 'sell';
  basePrice: number;
  gameStep: number;
}

export interface GeneratedMarketNews {
  headline: string;
  body: string;
  expertComment?: string;
  marketImpact?: {
    shortTerm: string;
    longTerm: string;
    affectedSectors: string[];
  };
  sentimentScore: number;
  reliability: number;
  tags: string[];
  ticker?: string;
}

export interface GeneratedInsiderNews {
  headline: string;
  body: string;
  technicalDetails?: string;
  insiderInfo?: string;
  impactPrediction: string;
  ticker: string;
  sentimentScore: number;
  expectedMovePercent: number;
  turnsUntilImpact: number;
}

export interface InsiderScheduledImpactPayload {
  turnsUntilImpact: number;
  triggerAtStep: number;
  direction: 'UP' | 'DOWN';
  movePercent: number;
  scheduledImpactId: string;
}

export interface GeneratedRumorNews {
  rumor: string;
  source: string;
  counterArguments: string;
  potentialImpact: string;
  reliabilityScore: number;
  expirationTime: string;
  ticker?: string;
}

export interface GeneratedOtcDeal {
  botName: string;
  ticker: string;
  companyName: string;
  side: 'buy' | 'sell';
  qty: number;
  price: number;
  turnsLeft: number;
  flavorText: string;
}

export interface GeneratedPropertyOffer {
  botName: string;
  itemRef: string;
  itemName: string;
  side: 'buy' | 'sell';
  price: number;
  turnsLeft: number;
  flavorText: string;
}

export interface PersistedNewsItem {
  id: string;
  kind: GeneratedNewsKind;
  title: string;
  body: string;
  excerpt: string;
  sentiment: Sentiment;
  impact: number;
  sector?: MarketSector | null;
  companyId?: string | null;
  ticker?: string;
  hot?: boolean;
  publishedAt: string;
  payload?: unknown;
}

export interface TurnGenerationResult {
  news: PersistedNewsItem[];
  otcDeal?: GeneratedOtcDeal;
  propertyOffer?: GeneratedPropertyOffer;
  insiderRolled: boolean;
}

export function calcInsiderNewsChancePercent(professionLevel: number) {
  return Math.min(20, Math.max(0, professionLevel * 2));
}

export function sentimentFromScore(score: number): Sentiment {
  if (score > 0.15) return 'POSITIVE';
  if (score < -0.15) return 'NEGATIVE';
  return 'NEUTRAL';
}

export function impactFromScore(score: number, strength = 5) {
  const normalized = Math.max(-1, Math.min(1, score));
  return Number((normalized * (strength / 10)).toFixed(3));
}
