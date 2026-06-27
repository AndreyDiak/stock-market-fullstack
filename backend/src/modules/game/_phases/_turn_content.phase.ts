import { NewsGenerationService } from '../../news/news_generation.service.js';
import { PropertyOffersService } from '../../property_offers/property_offers.service.js';
import { OtcDealGenerator } from '../_generators/_otc_deal.generator.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

export type TurnContentType = 'property' | 'otc' | 'insider' | 'junk';

const CONTENT_WEIGHTS: { type: TurnContentType; weight: number }[] = [
  { type: 'property', weight: 20 },
  { type: 'otc', weight: 20 },
  { type: 'insider', weight: 15 },
  { type: 'junk', weight: 45 },
];

function pickContentType(random: () => number = Math.random): TurnContentType {
  const total = CONTENT_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
  let roll = random() * total;
  for (const entry of CONTENT_WEIGHTS) {
    roll -= entry.weight;
    if (roll <= 0) return entry.type;
  }
  return 'junk';
}

/** Единая фаза генерации контента хода: property / OTC / insider / junk */
export class TurnContentPhase implements TurnPhase {
  readonly id = 'turn-content';
  readonly #newsService: NewsGenerationService;
  readonly #propertyOffersService: PropertyOffersService;
  readonly #otcGenerator: OtcDealGenerator;
  readonly #pickContent: () => TurnContentType;

  constructor(
    newsService: NewsGenerationService,
    propertyOffersService: PropertyOffersService,
    otcGenerator: OtcDealGenerator,
    pickContent: () => TurnContentType = () => pickContentType(),
  ) {
    this.#newsService = newsService;
    this.#propertyOffersService = propertyOffersService;
    this.#otcGenerator = otcGenerator;
    this.#pickContent = pickContent;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    const contentType = this.#pickContent();

    switch (contentType) {
      case 'property': {
        const offer = await this.#propertyOffersService.createWithNews(
          context.gameId,
          context.game.step,
          context.game.character.inventoryItems,
        );
        if (offer) {
          state.propertyOffersCreated = true;
        } else {
          const junk = await this.#newsService.generateJunkNews({
            gameId: context.gameId,
            gameStep: context.game.step,
          });
          state.news.push(junk);
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
          const junk = await this.#newsService.generateJunkNews({
            gameId: context.gameId,
            gameStep: context.game.step,
          });
          state.news.push(junk);
        }
        break;
      }
      case 'insider': {
        const { news } = await this.#newsService.generateInsiderNews({
          gameId: context.gameId,
          gameStep: context.game.step,
        });
        state.insiderRolled = true;
        state.news.push(news);
        break;
      }
      case 'junk':
      default: {
        const junk = await this.#newsService.generateJunkNews({
          gameId: context.gameId,
          gameStep: context.game.step,
        });
        state.news.push(junk);
        break;
      }
    }
  }
}

export { pickContentType };
