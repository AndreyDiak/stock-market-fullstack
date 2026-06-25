import type { TurnContext, TurnPhase, TurnState } from './_types.js';

export class GamePipeline {
  readonly #phases: TurnPhase[];

  constructor(phases: TurnPhase[]) {
    this.#phases = phases;
  }

  async run(context: TurnContext, state: TurnState): Promise<void> {
    for (const phase of this.#phases) {
      await phase.execute(context, state);
    }
  }
}
