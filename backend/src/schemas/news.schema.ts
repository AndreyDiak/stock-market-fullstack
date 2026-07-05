import { z } from 'zod';

const sentimentSchema = z.enum(['POSITIVE', 'NEGATIVE', 'NEUTRAL']);

export const newsKindSchema = z.enum([
  'WELCOME',
  'MARKET',
  'INSIDER',
  'RUMOR',
  'OTC_DEAL',
  'PROPERTY_OFFER',
  'PROPERTY_DEAL',
  'PROPERTY_INSTALLMENT',
  'STOCK_TRADE',
  'IPO_ANNOUNCE',
  'IPO_COMPLETE',
]);

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

export const gameNewsResponseSchema = z.object({
  news: z.array(generatedNewsItemSchema),
});
