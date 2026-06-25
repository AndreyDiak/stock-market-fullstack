import type { PrismaClient } from '@prisma/client';
import { NewsGenerationService } from '../../news/news_generation.service.js';
import { PriceImpactService } from '../../market/price_impact.service.js';
import { PassiveIncomeService } from '../_passive_income.service.js';
import { OtcDealGenerator } from '../_generators/_otc_deal.generator.js';
import { PropertyOfferGenerator } from '../_generators/_property_offer.generator.js';
import { GamePipeline } from '../_pipeline.js';
import { AdvanceStepPhase } from './_advance_step.phase.js';
import { EconomyPhase } from './_economy.phase.js';
import { NewsPhase } from './_news.phase.js';
import { OtcDealsPhase } from './_otc_deals.phase.js';
import { PriceImpactPhase } from './_price_impact.phase.js';
import { PropertyOffersPhase } from './_property_offers.phase.js';

/**
 * Порядок фаз завершения хода.
 * Новые механики добавляйте отдельными классами TurnPhase и вставляйте в нужное место:
 * - ExpensesPhase — случайные траты
 * - BotTradingPhase — сделки ботов на бирже
 * - OtcDealsExpiryPhase — истечение срока OTC-сделок
 * - PriceImpactPhase — применение отложенных движений цен (инсайд)
 * - SalaryCyclePhase — выплата зарплаты по циклу
 */
export function createGamePipeline(prisma: PrismaClient): GamePipeline {
  return new GamePipeline([
    new EconomyPhase(new PassiveIncomeService(prisma)),
    new AdvanceStepPhase(prisma),
    new PriceImpactPhase(new PriceImpactService(prisma)),
    new NewsPhase(new NewsGenerationService(prisma)),
    new OtcDealsPhase(new OtcDealGenerator()),
    new PropertyOffersPhase(new PropertyOfferGenerator()),
  ]);
}
