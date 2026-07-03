import { z } from 'zod';
import { characterSchema } from './character.schema.js';
import { generatedNewsItemSchema, otcDealSchema } from './turn.schema.js';

export const acceptOtcDealBodySchema = z.object({
  deal: otcDealSchema,
});

export const acceptOtcDealResponseSchema = z.object({
  balance: z.number(),
  character: characterSchema,
  news: generatedNewsItemSchema,
});

export type AcceptOtcDealBody = z.infer<typeof acceptOtcDealBodySchema>;
export type AcceptOtcDealResponse = z.infer<typeof acceptOtcDealResponseSchema>;
