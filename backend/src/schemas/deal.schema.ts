import { z } from 'zod';
import { characterSchema } from './character.schema.js';
import { generatedNewsItemSchema } from './news.schema.js';

export const dealAssetTypeSchema = z.enum(['CASH', 'STOCK', 'PROPERTY']);

export const dealAssetSchema = z.object({
  type: dealAssetTypeSchema,

  cashAmount: z.number().optional(),

  stockListingId: z.string().optional(),
  ticker: z.string().optional(),
  companyName: z.string().optional(),
  shares: z.number().int().optional(),

  propertyId: z.string().optional(),
  propertyName: z.string().optional(),

  estimatedValue: z.number(),
});

export const dealBundleSchema = z.object({
  assets: z.array(dealAssetSchema),
  totalEstimatedValue: z.number(),
});

export const dealOfferStatusSchema = z.enum([
  'ACTIVE',
  'ACCEPTED',
  'REJECTED',
  'EXPIRED',
  'NEGOTIATED',
]);

export const dealPurposeSchema = z.enum([
  'VALUE_EXCHANGE',
  'LIQUIDITY',
  'DREAM_HELPER',
  'STOCK_PACKAGE',
]);

export const dealOfferSchema = z.object({
  id: z.string().uuid(),
  botCharacterId: z.string().uuid(),
  botName: z.string(),
  botProfession: z.string(),
  botAvatarSrc: z.string().optional(),

  purpose: dealPurposeSchema.default('VALUE_EXCHANGE'),
  botGives: dealBundleSchema,
  playerGives: dealBundleSchema,

  requiredReputation: z.number(),
  requiredTradingLevel: z.number().int(),
  reputationPenalty: z.number(),

  playerBenefitValue: z.number(),
  playerBenefitPercent: z.number(),

  status: dealOfferStatusSchema,
  turnCreated: z.number().int(),
  expiresTurn: z.number().int(),
  expiresInTurns: z.number().int(),
});

export const acceptDealBodySchema = z.object({
  dealId: z.string().uuid(),
});

export const acceptDealResponseSchema = z.object({
  balance: z.number(),
  character: characterSchema,
  news: generatedNewsItemSchema,
});

export type DealAssetType = z.infer<typeof dealAssetTypeSchema>;
export type DealAsset = z.infer<typeof dealAssetSchema>;
export type DealBundle = z.infer<typeof dealBundleSchema>;
export type DealOfferStatus = z.infer<typeof dealOfferStatusSchema>;
export type DealPurpose = z.infer<typeof dealPurposeSchema>;
export type DealOfferDto = z.infer<typeof dealOfferSchema>;
export type AcceptDealBody = z.infer<typeof acceptDealBodySchema>;
export type AcceptDealResponse = z.infer<typeof acceptDealResponseSchema>;
