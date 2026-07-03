import { NPCS } from '@/assets/npcs.js';
import { REAL_ESTATE } from '@/assets/real_estate.js';
import { NewsGenerationService } from '@/modules/news/news_generation.service.js';
import { buildInstallmentInventoryFields } from '@/modules/property_offers/_installment_purchase.js';
import { PropertyOffersService } from '@/modules/property_offers/property_offers.service.js';
import { AppError } from '@/utils/errors.js';
import type { Character, Game, InventoryItem, PrismaClient } from '@prisma/client';
import { GameStatus } from '@prisma/client';
import { serializeGame } from './game_serializer.js';
import type { CreateSaveInput, UpdateSaveInput } from './saves.schema.js';

const characterInclude = {
  inventoryItems: {
    orderBy: { purchasedAt: 'asc' as const },
  },
} as const;

type GameWithCharacter = Game & {
  character: Character & { inventoryItems: InventoryItem[] };
};

export class SavesService {
  readonly #newsService: NewsGenerationService;
  readonly #propertyOffersService: PropertyOffersService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#newsService = new NewsGenerationService(prisma);
    this.#propertyOffersService = new PropertyOffersService(prisma);
  }

  async listSaves(userId: string) {
    const games = await this.#prisma.game.findMany({
      where: { userId },
      include: { character: { include: characterInclude } },
      orderBy: { slot: 'asc' },
    });

    return games.map(serializeGame);
  }

  async create(userId: string, data: CreateSaveInput) {
    const existingSlot = await this.#prisma.game.findUnique({
      where: {
        userId_slot: { userId, slot: data.slot },
      },
    });

    if (existingSlot) {
      throw new AppError(409, 'SLOT_OCCUPIED', `Slot ${data.slot} is already occupied`);
    }

    const character = NPCS.find((npc) => npc.profession === data.profession);

    if (!character) {
      throw new AppError(404, 'CHARACTER_NOT_FOUND', `Profession ${data.profession} not found`);
    }

    const game = await this.#prisma.$transaction(async (tx) => {
      const starterItems = character.items.slice(0, 1);

      return tx.game.create({
        data: {
          userId,
          name: data.name ?? 'Новая игра',
          slot: data.slot,
          startedAt: new Date(),
          character: {
            create: {
              name: character.name,
              profession: character.profession,
              professionLevel: 1,
              balance: character.balance,
              salary: character.salary,
              reputation: 3,
              tradingLevel: 1,
              bankingLevel: 1,
              propertySlotLevel: 1,
              isNpc: false,
              dreamItemRefs: character.dreams,
              inventoryItems: {
                create: starterItems.map((item) => {
                  const template = REAL_ESTATE.find((r) => r.id === item.itemRef)!;
                  return this.#starterInventoryFields(item, template);
                }),
              },
            },
          },
        },
        include: { character: { include: characterInclude } },
      });
    });

    await this.#newsService.createWelcomeNews(game.id, character.name, 1);

    const saved = await this.#prisma.game.findUniqueOrThrow({
      where: { id: game.id },
      include: { character: { include: characterInclude } },
    });

    if (!saved.character) {
      throw new AppError(500, 'CHARACTER_MISSING', 'Character was not created');
    }

    await this.#propertyOffersService.createStarterOffers(
      game.id,
      1,
      saved.character.inventoryItems,
    );

    return serializeGame(saved);
  }

  async get(userId: string, saveId: string) {
    const game = await this.#loadSaveForUser(userId, saveId);
    const bootstrapped = await this.ensureGameBootstrap(game);
    return serializeGame(bootstrapped);
  }

  async ensureGameBootstrap(game: GameWithCharacter): Promise<GameWithCharacter> {
    const character = game.character;

    const welcomeCount = await this.#prisma.news.count({
      where: { gameId: game.id, kind: 'WELCOME' },
    });

    if (welcomeCount === 0) {
      await this.#newsService.createWelcomeNews(
        game.id,
        character.name,
        character.tradingLevel,
      );
    }

    return game;
  }

  async #loadSaveForUser(userId: string, saveId: string): Promise<GameWithCharacter> {
    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
      include: { character: { include: characterInclude } },
    });

    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }

    return game as GameWithCharacter;
  }

  async update(userId: string, saveId: string, data: UpdateSaveInput) {
    await this.get(userId, saveId);

    return this.#prisma.game.update({
      where: { id: saveId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.status === GameStatus.COMPLETED && { completedAt: new Date() }),
      },
      include: { character: { include: characterInclude } },
    }).then(serializeGame);
  }

  async delete(userId: string, saveId: string) {
    await this.get(userId, saveId);

    await this.#prisma.game.delete({
      where: { id: saveId },
    });

    return { success: true };
  }

  #starterInventoryFields(
    starter: { itemRef: string; installmentsPaid: number },
    template: (typeof REAL_ESTATE)[number],
  ) {
    const installment = buildInstallmentInventoryFields({
      purchasePrice: template.basePrice,
      installmentsTotal: template.installmentMonths,
      installmentsPaid: starter.installmentsPaid,
      bankingLevel: 1,
    });

    return {
      itemRef: starter.itemRef,
      name: template.name,
      purchasePrice: template.basePrice,
      isInstallment: true,
      downPaymentAmount: installment.downPaymentAmount,
      monthlyPayment: installment.monthlyPayment,
      installmentsTotal: installment.installmentsTotal,
      installmentsPaid: installment.installmentsPaid,
      special: template.special,
    };
  }
}
