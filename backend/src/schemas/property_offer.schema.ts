import { z } from 'zod';
import { generatedNewsItemSchema } from './news.schema.js';
import { characterSchema } from './character.schema.js';
import { nextTurnForecastResponseSchema } from './forecast.schema.js';

export const propertyOfferTypeSchema = z.enum(['BUY', 'SELL']);
export const profitGradeSchema = z.enum(['F', 'E', 'D', 'C', 'B', 'A']);

export const propertyOfferSchema = z.object({
  id: z.string().uuid(),
  assetId: z.string(),
  itemName: z.string(),
  inventoryItemId: z.string().uuid().nullable(),
  type: propertyOfferTypeSchema,
  offerPrice: z.number(),
  marketPrice: z.number(),
  profitPercent: z.number(),
  profitGrade: profitGradeSchema,
  requiredBankingLevel: z.number().int(),
  isHot: z.boolean(),
  expiresInTurns: z.number().int(),
  isLocked: z.boolean(),
  downPaymentPercent: z.number(),
  pendingNegotiatedPrice: z.number().nullable(),
  pendingNegotiatedPercent: z.number().int().nullable(),
});

export const negotiatePropertyOfferBodySchema = z.object({
  adjustmentPercent: z.coerce
    .number()
    .finite()
    .transform((value) => Math.round(value)),
});

export const propertyOfferPaymentModeSchema = z.enum(['full', 'installment']);

export const acceptPropertyOfferBodySchema = z.object({
  paymentMode: propertyOfferPaymentModeSchema.optional().default('installment'),
});

export const negotiateDealSchema = z.object({
  assetId: z.string(),
  itemName: z.string(),
  type: propertyOfferTypeSchema,
  price: z.number(),
  action: z.enum(['purchased', 'sold']),
});

export const negotiatePropertyOfferResponseSchema = z.object({
  success: z.boolean(),
  d20: z.number().int(),
  roll: z.number().int(),
  target: z.number().int(),
  negotiatedPrice: z.number().nullable(),
  deal: negotiateDealSchema.nullable(),
  previousReputation: z.number(),
  reputation: z.number(),
  previousBalance: z.number(),
  balance: z.number(),
  propertyOffers: z.array(propertyOfferSchema),
  character: characterSchema,
  news: generatedNewsItemSchema.nullable(),
});

export const installmentSaleBreakdownSchema = z.object({
  paidTotal: z.number(),
  remainingTotal: z.number(),
  saleProceeds: z.number(),
  purchasePrice: z.number(),
  priceDelta: z.number(),
  netProfit: z.number(),
});

export const acceptPropertyOfferResponseSchema = z.object({
  balance: z.number(),
  previousBalance: z.number(),
  previousReputation: z.number(),
  reputation: z.number(),
  profitAmount: z.number(),
  installmentBreakdown: installmentSaleBreakdownSchema.nullable(),
  deal: negotiateDealSchema,
  character: characterSchema,
  propertyOffers: z.array(propertyOfferSchema),
  news: generatedNewsItemSchema,
  nextTurnForecast: nextTurnForecastResponseSchema,
});

export type PropertyOfferDto = z.infer<typeof propertyOfferSchema>;
