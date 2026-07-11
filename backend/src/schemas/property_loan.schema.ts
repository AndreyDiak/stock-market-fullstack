import { z } from 'zod';
import { characterSchema } from './character.schema.js';
import { generatedNewsItemSchema } from './news.schema.js';
import { nextTurnForecastResponseSchema } from './turn.schema.js';

export const payOffInstallmentBodySchema = z.object({
  payPercent: z.number().int().min(5).max(100).refine((value) => value % 5 === 0, {
    message: 'payPercent must be a multiple of 5',
  }),
});

export const payOffInstallmentResponseSchema = z.object({
  balance: z.number(),
  previousBalance: z.number(),
  character: characterSchema,
  news: generatedNewsItemSchema,
  nextTurnForecast: nextTurnForecastResponseSchema,
});
