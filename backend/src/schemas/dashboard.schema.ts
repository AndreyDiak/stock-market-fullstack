import { z } from 'zod';
import { gameSchema } from './game.schema.js';
import { generatedNewsItemSchema, nextTurnForecastResponseSchema } from './turn.schema.js';
import { characterSkillsStateSchema } from './character_skills.schema.js';
import { propertyOfferSchema } from './property_offer.schema.js';
import {
  ipoSchema,
  marketSentimentSchema,
  portfolioRowSchema,
  sectorMomentumSchema,
  stockListingSchema,
} from './stock.schema.js';

export const gameDashboardResponseSchema = z.object({
  game: gameSchema,
  news: z.array(generatedNewsItemSchema),
  nextTurnForecast: nextTurnForecastResponseSchema,
  characterSkills: characterSkillsStateSchema,
  propertyOffers: z.array(propertyOfferSchema),
  stocks: z.array(stockListingSchema).optional(),
  portfolio: z.array(portfolioRowSchema).optional(),
  marketSentiment: marketSentimentSchema.optional(),
  sectorMomentum: z.array(sectorMomentumSchema).optional(),
  ipos: z.array(ipoSchema).optional(),
});
export type GameDashboardResponse = z.infer<typeof gameDashboardResponseSchema>;
