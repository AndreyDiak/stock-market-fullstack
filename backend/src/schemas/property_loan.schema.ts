import { z } from 'zod';
import { characterSchema } from './character.schema.js';
import { generatedNewsItemSchema } from './news.schema.js';
import { nextTurnForecastResponseSchema } from './turn.schema.js';

export const payOffInstallmentResponseSchema = z.object({
  balance: z.number(),
  previousBalance: z.number(),
  character: characterSchema,
  news: generatedNewsItemSchema,
  nextTurnForecast: nextTurnForecastResponseSchema,
});
