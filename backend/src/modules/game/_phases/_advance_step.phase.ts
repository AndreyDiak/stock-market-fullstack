import type { PrismaClient } from '@prisma/client';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Инкремент step и перезагрузка состояния игры */
export class AdvanceStepPhase implements TurnPhase {
  readonly id = 'advance-step';
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async execute(context: TurnContext, _state: TurnState): Promise<void> {
    const updated = await this.#prisma.game.update({
      where: { id: context.gameId },
      data: { step: { increment: 1 } },
      include: {
        character: {
          include: { inventoryItems: true },
        },
      },
    });

    if (!updated.character) {
      throw new Error('Character missing after step advance');
    }

    context.game = updated as TurnContext['game'];
  }
}
