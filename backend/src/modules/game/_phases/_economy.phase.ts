import type { TurnContext, TurnPhase, TurnState } from '../_types.js';
import type { PassiveIncomeService } from '../_passive_income.service.js';

/** Зарплата, рассрочка, пассивный доход */
export class EconomyPhase implements TurnPhase {
  readonly id = 'economy';
  readonly #passiveIncomeService: PassiveIncomeService;

  constructor(passiveIncomeService: PassiveIncomeService) {
    this.#passiveIncomeService = passiveIncomeService;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    state.passiveIncome = await this.#passiveIncomeService.process(
      context.game.character,
      context.game.step,
      context.gameId,
    );
  }
}
