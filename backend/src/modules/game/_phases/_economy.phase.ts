import { NewsGenerationService } from '../../news/news_generation.service.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';
import type { PassiveIncomeService } from '../_passive_income.service.js';

/** Зарплата, рассрочка, пассивный доход */
export class EconomyPhase implements TurnPhase {
  readonly id = 'economy';
  readonly #passiveIncomeService: PassiveIncomeService;
  readonly #newsService: NewsGenerationService;

  constructor(passiveIncomeService: PassiveIncomeService, newsService: NewsGenerationService) {
    this.#passiveIncomeService = passiveIncomeService;
    this.#newsService = newsService;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    state.passiveIncome = await this.#passiveIncomeService.process(
      context.game.character,
      context.game.step,
      context.gameId,
    );

    for (const payment of state.passiveIncome.installmentPayments) {
      const news = await this.#newsService.createPropertyInstallmentNews({
        gameId: context.gameId,
        gameStep: context.game.step,
        itemRef: payment.itemRef,
        itemName: payment.itemName,
        amount: payment.amount,
        paidOff: payment.paidOff,
        installmentsPaidAfter: payment.installmentsPaidAfter,
        installmentsTotal: payment.installmentsTotal,
      });
      state.news.push(news);
    }
  }
}
