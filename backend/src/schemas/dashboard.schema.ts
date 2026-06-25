import { z } from 'zod';
import { gameSchema } from './game.schema.js';
import { generatedNewsItemSchema, nextTurnForecastResponseSchema } from './turn.schema.js';

export const gameDashboardResponseSchema = z.object({
  game: gameSchema,
  news: z.array(generatedNewsItemSchema),
  nextTurnForecast: nextTurnForecastResponseSchema,
});

export type GameDashboardResponse = z.infer<typeof gameDashboardResponseSchema>;
