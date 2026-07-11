import type { PrismaClient, Character, InventoryItem } from '@prisma/client';
import { PROFESSION_DREAMS, type DreamStageRequirement } from '../../assets/dreams.js';
import { AppError } from '../../utils/errors.js';
import type { DreamResponse, DreamStageResponse, DreamStageStatus } from '../../schemas/dream.schema.js';

type CharacterWithInventory = Character & { inventoryItems: InventoryItem[] };

export class DreamService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async getDream(character: CharacterWithInventory, currentStep: number): Promise<DreamResponse> {
    let dream = await this.#prisma.dream.findUnique({
      where: { characterId: character.id },
      include: { stages: { orderBy: { stageIndex: 'asc' } } },
    });

    if (!dream) {
      dream = await this.#createDream(character);
    }

    const definition = PROFESSION_DREAMS[character.profession as keyof typeof PROFESSION_DREAMS];
    if (!definition) {
      throw new AppError(404, 'DREAM_DEFINITION_NOT_FOUND', 'No dream definition for this profession');
    }

    const portfolioValue = await this.#calculatePortfolioValue(character.id, character.gameId!);
    const passiveIncome = this.#calculatePassiveIncome(character.inventoryItems);
    const hasActiveInstallments = character.inventoryItems.some(
      (i) => i.isInstallment && !i.isPaidOff,
    );

    const stages: DreamStageResponse[] = definition.stages.map((req, index) => {
      const dbStage = dream!.stages.find((s) => s.stageIndex === index);

      let status: DreamStageStatus;
      if (dbStage?.status === 'COMPLETED') {
        status = 'COMPLETED';
      } else if (index < dream!.currentStage) {
        status = 'COMPLETED';
      } else if (index > dream!.currentStage) {
        status = 'LOCKED';
      } else if (this.#checkRequirements(req, character, portfolioValue, passiveIncome, hasActiveInstallments)) {
        status = 'READY_TO_COMPLETE';
      } else {
        status = 'ACTIVE';
      }

      return {
        stageIndex: index,
        status,
        requirement: req,
        completedAt: dbStage?.completedAt?.toISOString() ?? null,
        completedTurn: dbStage?.completedTurn ?? null,
      };
    });

    return {
      id: dream.id,
      dreamType: definition.dreamType,
      title: definition.title,
      description: definition.description,
      currentStage: dream.currentStage,
      stages,
    };
  }

  async completeStage(characterId: string, dreamId: string, gameId?: string): Promise<DreamResponse> {
    const character = await this.#prisma.character.findUnique({
      where: { id: characterId },
      include: { inventoryItems: true },
    });
    if (!character) {
      throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Character not found');
    }

    const dream = await this.#prisma.dream.findUnique({
      where: { id: dreamId, characterId },
      include: { stages: { orderBy: { stageIndex: 'asc' } } },
    });
    if (!dream) {
      throw new AppError(404, 'DREAM_NOT_FOUND', 'Dream not found');
    }

    const definition = PROFESSION_DREAMS[character.profession as keyof typeof PROFESSION_DREAMS];
    if (!definition) {
      throw new AppError(404, 'DREAM_DEFINITION_NOT_FOUND', 'No dream definition');
    }

    const activeStageIndex = dream.currentStage;
    if (activeStageIndex >= definition.stages.length) {
      throw new AppError(400, 'DREAM_ALREADY_FULFILLED', 'All stages are already completed');
    }

    if (activeStageIndex === definition.stages.length - 1) {
      throw new AppError(400, 'USE_FULFILL_ENDPOINT', 'Use fulfill endpoint for the final stage');
    }

    const req = definition.stages[activeStageIndex]!;
    const portfolioValue = await this.#calculatePortfolioValue(character.id, character.gameId!);
    const passiveIncome = this.#calculatePassiveIncome(character.inventoryItems);
    const hasActiveInstallments = character.inventoryItems.some(
      (i) => i.isInstallment && !i.isPaidOff,
    );

    if (!this.#checkRequirements(req, character, portfolioValue, passiveIncome, hasActiveInstallments)) {
      throw new AppError(400, 'STAGE_REQUIREMENTS_NOT_MET', 'Stage requirements are not met');
    }

    let currentTurn = 0;
    if (gameId) {
      const game = await this.#prisma.game.findUnique({ where: { id: gameId } });
      currentTurn = game?.step ?? 0;
    }

    const existing = dream.stages.find((s) => s.stageIndex === activeStageIndex);
    if (existing) {
      await this.#prisma.dreamStage.update({
        where: { id: existing.id },
        data: { status: 'COMPLETED', completedAt: new Date(), completedTurn: currentTurn },
      });
    } else {
      await this.#prisma.dreamStage.create({
        data: {
          dreamId: dream.id,
          stageIndex: activeStageIndex,
          status: 'COMPLETED',
          completedAt: new Date(),
          completedTurn: currentTurn,
        },
      });
    }

    await this.#prisma.dream.update({
      where: { id: dream.id },
      data: { currentStage: activeStageIndex + 1 },
    });

    return this.getDream(character, 0);
  }

  async fulfillDream(characterId: string, gameId: string, dreamId: string): Promise<void> {
    const character = await this.#prisma.character.findUnique({
      where: { id: characterId },
      include: { inventoryItems: true },
    });
    if (!character) {
      throw new AppError(404, 'CHARACTER_NOT_FOUND', 'Character not found');
    }

    const dream = await this.#prisma.dream.findUnique({
      where: { id: dreamId, characterId },
    });
    if (!dream) {
      throw new AppError(404, 'DREAM_NOT_FOUND', 'Dream not found');
    }

    const definition = PROFESSION_DREAMS[character.profession as keyof typeof PROFESSION_DREAMS];
    if (!definition) {
      throw new AppError(404, 'DREAM_DEFINITION_NOT_FOUND', 'No dream definition');
    }

    const lastStageIndex = definition.stages.length - 1;
    if (dream.currentStage < lastStageIndex) {
      throw new AppError(400, 'PREVIOUS_STAGES_NOT_COMPLETED', 'Complete all previous stages first');
    }

    const lastReq = definition.stages[lastStageIndex]!;
    const portfolioValue = await this.#calculatePortfolioValue(character.id, character.gameId!);
    const passiveIncome = this.#calculatePassiveIncome(character.inventoryItems);
    const hasActiveInstallments = character.inventoryItems.some(
      (i) => i.isInstallment && !i.isPaidOff,
    );

    if (!this.#checkRequirements(lastReq, character, portfolioValue, passiveIncome, hasActiveInstallments)) {
      throw new AppError(400, 'FINAL_STAGE_REQUIREMENTS_NOT_MET', 'Final stage requirements are not met');
    }

    await this.#prisma.game.update({
      where: { id: gameId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  #checkRequirements(
    req: DreamStageRequirement,
    character: CharacterWithInventory,
    portfolioValue: number,
    passiveIncome: number,
    hasActiveInstallments: boolean,
  ): boolean {
    if (req.minBalance !== undefined && character.balance < req.minBalance) return false;
    if (req.minPortfolioValue !== undefined && portfolioValue < req.minPortfolioValue) return false;
    if (req.minPassiveIncome !== undefined && passiveIncome < req.minPassiveIncome) return false;
    if (req.minReputation !== undefined && character.reputation < req.minReputation) return false;
    if (req.minProfessionLevel !== undefined && character.professionLevel < req.minProfessionLevel) return false;
    if (req.minTradingLevel !== undefined && character.tradingLevel < req.minTradingLevel) return false;
    if (req.minBankingLevel !== undefined && character.bankingLevel < req.minBankingLevel) return false;
    if (req.noActiveInstallments !== undefined && req.noActiveInstallments && hasActiveInstallments) return false;

    if (req.requiredItems) {
      const ownedRefs = new Set(character.inventoryItems.map((i) => i.itemRef));
      for (const ref of req.requiredItems) {
        if (!ownedRefs.has(ref)) return false;
      }
    }

    if (req.requireItemFullyOwned) {
      for (const ref of req.requireItemFullyOwned) {
        const item = character.inventoryItems.find((i) => i.itemRef === ref);
        if (!item) return false;
        if (item.isInstallment && !item.isPaidOff) return false;
      }
    }

    return true;
  }

  async #calculatePortfolioValue(characterId: string, gameId: string): Promise<number> {
    const stocks = await this.#prisma.stock.findMany({
      where: { ownerId: characterId, gameId },
    });
    return stocks.reduce((sum, s) => sum + s.quantity * s.purchasePrice, 0);
  }

  #calculatePassiveIncome(inventory: InventoryItem[]): number {
    const INCOME_REGEX = /пассивный доход\s+(\d+)/i;
    return inventory.reduce((sum, item) => {
      if (item.special) {
        const match = INCOME_REGEX.exec(item.special);
        if (match) return sum + Number(match[1]);
      }
      return sum;
    }, 0);
  }

  async #createDream(character: CharacterWithInventory) {
    const definition = PROFESSION_DREAMS[character.profession as keyof typeof PROFESSION_DREAMS];
    if (!definition) {
      throw new AppError(404, 'DREAM_DEFINITION_NOT_FOUND', 'No dream definition');
    }

    return this.#prisma.dream.create({
      data: {
        characterId: character.id,
        dreamType: definition.dreamType,
        currentStage: 0,
        stages: {
          create: definition.stages.map((_, index) => ({
            stageIndex: index,
            status: index === 0 ? 'ACTIVE' : 'LOCKED',
          })),
        },
      },
      include: { stages: { orderBy: { stageIndex: 'asc' } } },
    });
  }

  async getDreamForGame(userId: string, saveId: string): Promise<DreamResponse> {
    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
      include: {
        character: {
          include: { inventoryItems: true },
        },
      },
    });
    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }
    return this.getDream(game.character, game.step);
  }

  async completeStageForGame(userId: string, saveId: string, dreamId: string): Promise<DreamResponse> {
    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
      select: { character: { select: { id: true } }, step: true },
    });
    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }
    return this.completeStage(game.character.id, dreamId, saveId);
  }

  async fulfillDreamForGame(userId: string, saveId: string, dreamId: string): Promise<void> {
    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
      select: { character: { select: { id: true } } },
    });
    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }
    return this.fulfillDream(game.character.id, saveId, dreamId);
  }
}
