import { z } from 'zod';
import { characterSchema } from './character.schema.js';
import { characterSkillsStateSchema } from './character_skills.schema.js';
import { nextTurnForecastResponseSchema } from './forecast.schema.js';
import { propertyOfferSchema } from './property_offer.schema.js';
import { generatedNewsItemSchema } from './news.schema.js';
import { dealOfferSchema } from './deal.schema.js';

export { generatedNewsItemSchema, gameNewsResponseSchema } from './news.schema.js';

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

export const dividendPayoutEventSchema = z.object({
  listingId: z.string().uuid(),
  ticker: z.string(),
  companyName: z.string(),
  totalPaid: z.number(),
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
  dealOffer: dealOfferSchema.optional(),
  propertyOffers: z.array(propertyOfferSchema),
  appliedPriceImpacts: z.array(appliedPriceImpactSchema).optional(),
  dividendPayouts: z.array(dividendPayoutEventSchema).optional(),
  characterSkills: characterSkillsStateSchema,
  gameOver: z.boolean(),
});

export type { NextTurnForecastResponse } from './forecast.schema.js';
export { nextTurnForecastResponseSchema, turnCashflowLineSchema } from './forecast.schema.js';

export type EndTurnResponse = z.infer<typeof endTurnResponseSchema>;
