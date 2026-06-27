import { z } from 'zod';
import { characterSchema } from './character.schema.js';

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
});

export const negotiatePropertyOfferBodySchema = z.object({
  adjustmentPercent: z.number().min(-15).max(45),
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
});

export const installmentSaleBreakdownSchema = z.object({
  paidTotal: z.number(),
  remainingTotal: z.number(),
  saleProceeds: z.number(),
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
});

export type PropertyOfferDto = z.infer<typeof propertyOfferSchema>;
