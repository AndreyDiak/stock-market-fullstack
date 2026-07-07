import { NewsGenerationService } from '../../news/news_generation.service.js';
import {
  pickNextContentType,
  type TurnContentType,
} from '../../news/news_cycle.js';
import type { GeneratedNewsKind } from '../../news/types.js';
import { PropertyOffersService } from '../../property_offers/property_offers.service.js';
import { OtcDealGenerator } from '../_generators/_otc_deal.generator.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Фаза генерации контента хода: строгий цикл stock → deal → realty */
export class TurnContentPhase implements TurnPhase {
  readonly id = 'turn-content';
  readonly #newsService: NewsGenerationService;
  readonly #propertyOffersService: PropertyOffersService;
  readonly #otcGenerator: OtcDealGenerator;
  readonly #pickContent: (lastKind: GeneratedNewsKind | null) => TurnContentType;

  constructor(
    newsService: NewsGenerationService,
    propertyOffersService: PropertyOffersService,
    otcGenerator: OtcDealGenerator,
    pickContent: (lastKind: GeneratedNewsKind | null) => TurnContentType = pickNextContentType,
  ) {
    this.#newsService = newsService;
    this.#propertyOffersService = propertyOffersService;
    this.#otcGenerator = otcGenerator;
    this.#pickContent = pickContent;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    const lastKind = await this.#newsService.getLatestCycleNewsKind(context.gameId);
    const contentType = this.#pickContent(lastKind);

    switch (contentType) {
      case 'property': {
        const result = await this.#propertyOffersService.createWithNews(
          context.gameId,
          context.game.step,
          context.game.character.inventoryItems,
        );
        if (result) {
          state.propertyOffersCreated = true;
          state.news.push(result.news);
        } else {
          const stock = await this.#newsService.generateStockNews({
            gameId: context.gameId,
            gameStep: context.game.step,
            profession: context.game.character.profession,
            professionLevel: context.game.character.professionLevel,
          });
          if (stock.insiderRolled) state.insiderRolled = true;
          state.news.push(stock.news);
        }
        break;
      }
      case 'otc': {
        const deal = await this.#otcGenerator.maybeGenerate({
          gameStep: context.game.step,
          playerPortfolioTickers: context.playerPortfolioTickers,
          chance: 1,
        });
        if (deal) {
          state.otcDeal = deal;
          const news = await this.#newsService.createOtcDealNews({
            gameId: context.gameId,
            gameStep: context.game.step,
            deal,
          });
          state.news.push(news);
        } else {
          const stock = await this.#newsService.generateStockNews({
            gameId: context.gameId,
            gameStep: context.game.step,
            profession: context.game.character.profession,
            professionLevel: context.game.character.professionLevel,
          });
          if (stock.insiderRolled) state.insiderRolled = true;
          state.news.push(stock.news);
        }
        break;
      }
      case 'stock':
      default: {
        const stock = await this.#newsService.generateStockNews({
          gameId: context.gameId,
          gameStep: context.game.step,
          profession: context.game.character.profession,
          professionLevel: context.game.character.professionLevel,
        });
        if (stock.insiderRolled) state.insiderRolled = true;
        state.news.push(stock.news);
        break;
      }
    }
  }
}

