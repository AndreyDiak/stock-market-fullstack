import { z } from 'zod';
import { generatedNewsItemSchema } from './news.schema.js';

export const stockArchetypeSchema = z.enum(['growth', 'dividend', 'speculative', 'defensive']);

export const stockGradeSchema = z.enum(['F', 'E', 'D', 'C', 'B', 'A']);

export const priceHistoryPointSchema = z.object({
  turn: z.number().int(),
  price: z.number(),
});

export const stockListingSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  ticker: z.string(),
  name: z.string(),
  sector: z.string(),
  grade: stockGradeSchema,
  currentPrice: z.number(),
  previousPrice: z.number(),
  dayChange: z.number(),
  availableOnExchange: z.boolean(),
  isLocked: z.boolean(),
  hasInsiderPressure: z.boolean(),
  hasNewsPressure: z.boolean(),
  archetype: stockArchetypeSchema.nullable(),
  archetypeLabel: z.string().nullable(),
  paysDividends: z.boolean(),
  turnsUntilDividend: z.number().int().nullable(),
  history: z.array(priceHistoryPointSchema),
});

export const portfolioRowSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  qty: z.number().int(),
  price: z.number(),
  purchasePrice: z.number(),
  changePct: z.number(),
  pnl: z.number(),
  listingId: z.string(),
  paysDividends: z.boolean(),
  turnsUntilDividend: z.number().int().nullable(),
  turnsHeldInCycle: z.number().int(),
});

export const marketSentimentSchema = z.object({
  value: z.number(),
  indicator: z.enum(['bearish', 'neutral', 'bullish']),
});

export const sectorMomentumSchema = z.object({
  sector: z.string(),
  value: z.number(),
  duration: z.number().int(),
  trend: z.enum(['rising', 'falling', 'neutral']),
});

export const stockListResponseSchema = z.object({
  stocks: z.array(stockListingSchema),
});

export const stockDetailResponseSchema = z.object({
  listing: stockListingSchema,
  history: z.array(priceHistoryPointSchema),
});

export const stockHistoryResponseSchema = z.object({
  history: z.array(priceHistoryPointSchema),
});

export const buyStockBodySchema = z.object({
  quantity: z.number().int().min(1),
});

export const buyStockResponseSchema = z.object({
  balance: z.number(),
  portfolio: z.array(portfolioRowSchema),
  news: generatedNewsItemSchema,
});

export const sellStockBodySchema = z.object({
  quantity: z.number().int().min(1),
});

export const sellStockResponseSchema = z.object({
  balance: z.number(),
  portfolio: z.array(portfolioRowSchema),
  news: generatedNewsItemSchema,
  gross: z.number(),
  commissionPercent: z.number(),
  commissionAmount: z.number(),
  net: z.number(),
});

export const portfolioResponseSchema = z.object({
  portfolio: z.array(portfolioRowSchema),
});

export const ipoSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  ticker: z.string(),
  companyName: z.string(),
  targetGrade: stockGradeSchema,
  ipoPrice: z.number(),
  ipoShares: z.number().int(),
  announcedAtTurn: z.number().int(),
  ipoAtTurn: z.number().int(),
  minSubscription: z.number().int(),
  maxSubscription: z.number().int(),
  isCompleted: z.boolean(),
  totalSubscribed: z.number().int().optional(),
});

export const ipoListResponseSchema = z.object({
  ipos: z.array(ipoSchema),
});

export const ipoSubscribeBodySchema = z.object({
  amount: z.number().int().min(1),
});

export const ipoSubscribeResponseSchema = z.object({
  ipos: z.array(ipoSchema),
});

export type BuyStockBody = z.infer<typeof buyStockBodySchema>;
export type SellStockBody = z.infer<typeof sellStockBodySchema>;
