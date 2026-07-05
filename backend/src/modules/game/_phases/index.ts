import type { PrismaClient } from '@prisma/client';
import { NewsGenerationService } from '../../news/news_generation.service.js';
import { PropertyOffersService } from '../../property_offers/property_offers.service.js';
import { PassiveIncomeService } from '../_passive_income.service.js';
import { OtcDealGenerator } from '../_generators/_otc_deal.generator.js';
import { GamePipeline } from '../_pipeline.js';
import { MarketService } from '../../market/market.service.js';
import { AdvanceStepPhase } from './_advance_step.phase.js';
import { EconomyPhase } from './_economy.phase.js';
import { MarketTurnPhase } from './_market_turn.phase.js';
import { PropertyOffersExpiryPhase } from './_property_offers_expiry.phase.js';
import { TurnContentPhase } from './_turn_content.phase.js';

/**
 * Порядок фаз завершения хода.
 */
export function createGamePipeline(prisma: PrismaClient): GamePipeline {
  const newsService = new NewsGenerationService(prisma);
  const propertyOffersService = new PropertyOffersService(prisma);
  const marketService = new MarketService(prisma);

  return new GamePipeline([
    new EconomyPhase(new PassiveIncomeService(prisma), newsService),
    new AdvanceStepPhase(prisma),
    new MarketTurnPhase(marketService),
    new PropertyOffersExpiryPhase(propertyOffersService),
    new TurnContentPhase(newsService, propertyOffersService, new OtcDealGenerator()),
  ]);
}
