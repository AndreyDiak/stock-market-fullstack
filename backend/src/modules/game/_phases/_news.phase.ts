import type { NewsGenerationService } from '../../news/news_generation.service.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Рыночные новости, инсайд, слухи */
export class NewsPhase implements TurnPhase {
  readonly id = 'news';
  readonly #newsService: NewsGenerationService;

  constructor(newsService: NewsGenerationService) {
    this.#newsService = newsService;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    const result = await this.#newsService.generateTurnNews({
      gameId: context.gameId,
      gameStep: context.game.step,
      professionLevel: context.game.character.professionLevel,
    });

    state.news.push(...result.news);
    state.insiderRolled = result.insiderRolled;
    state.insiderChancePercent = result.insiderChancePercent;
  }
}
