import { z } from 'zod';
import { characterSchema } from './character.schema.js';
import { characterSkillsStateSchema } from './character_skills.schema.js';
import { nextTurnForecastResponseSchema } from './forecast.schema.js';

const sentimentSchema = z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']);
const newsKindSchema = z.enum(['WELCOME', 'MARKET', 'INSIDER', 'RUMOR', 'OTC_DEAL', 'PROPERTY_OFFER']);

export const generatedNewsItemSchema = z.object({
  id: z.string().uuid(),
  kind: newsKindSchema,
  title: z.string(),
  body: z.string(),
  excerpt: z.string(),
  sentiment: sentimentSchema,
  impact: z.number(),
  sector: z.string().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  ticker: z.string().optional(),
  hot: z.boolean().optional(),
  publishedAt: z.string().datetime(),
  publishedStep: z.number().int().positive().optional(),
  payload: z.unknown().optional(),
});

export const otcDealSchema = z.object({
  botName: z.string(),
  ticker: z.string(),
  companyName: z.string(),
  side: z.enum(['buy', 'sell']),
  qty: z.number().int(),
  price: z.number(),
  turnsLeft: z.number().int(),
  flavorText: z.string(),
});

export const propertyOfferSchema = z.object({
  botName: z.string(),
  itemRef: z.string(),
  itemName: z.string(),
  side: z.enum(['buy', 'sell']),
  price: z.number(),
  turnsLeft: z.number().int(),
  flavorText: z.string(),
});

export const endTurnBodySchema = z.object({
  expectedStep: z.number().int().positive(),
});

export const passiveIncomeResultSchema = z.object({
  salary: z.number(),
  livingExpense: z.number(),
  installmentTotal: z.number(),
  passiveIncome: z.number(),
  itemsPaidOff: z.array(z.string()),
  netChange: z.number(),
});

export const appliedPriceImpactSchema = z.object({
  impactId: z.string().uuid(),
  ticker: z.string(),
  direction: z.enum(['UP', 'DOWN']),
  movePercent: z.number(),
  previousPrice: z.number(),
  newPrice: z.number(),
  triggerAtStep: z.number().int(),
});

export const endTurnResponseSchema = z.object({
  step: z.number().int(),
  balance: z.number(),
  character: characterSchema,
  nextTurnForecast: nextTurnForecastResponseSchema,
  passiveIncome: passiveIncomeResultSchema,
  insiderChancePercent: z.number(),
  insiderRolled: z.boolean(),
  news: z.array(generatedNewsItemSchema),
  otcDeal: otcDealSchema.optional(),
  propertyOffer: propertyOfferSchema.optional(),
  appliedPriceImpacts: z.array(appliedPriceImpactSchema).optional(),
  characterSkills: characterSkillsStateSchema,
});

export const gameNewsResponseSchema = z.object({
  news: z.array(generatedNewsItemSchema),
});

export type { NextTurnForecastResponse } from './forecast.schema.js';
export { nextTurnForecastResponseSchema, turnCashflowLineSchema } from './forecast.schema.js';

export type EndTurnResponse = z.infer<typeof endTurnResponseSchema>;
