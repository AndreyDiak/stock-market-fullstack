import { NPCS } from '@/assets/npcs.js';
import { REAL_ESTATE } from '@/assets/realEstate.js';
import { AppError } from '@/utils/errors.js';
import type { PrismaClient } from '@prisma/client';
import { GameStatus } from '@prisma/client';
import type { CreateGameInput, UpdateGameInput } from './games.schema.js';

export class GamesService {
  constructor(private prisma: PrismaClient) {}

  async listGames(userId: string) {
    return this.prisma.game.findMany({
      where: { userId },
      include: { character: true },
      orderBy: { slot: 'asc' },
    });
  }

  async create(userId: string, data: CreateGameInput) {
    const existingSlot = await this.prisma.game.findUnique({
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

    return this.prisma.$transaction(async (tx) => {
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
              balance: character.balance,
              salary: character.salary,
              isNpc: false,
              dreamItemRefs: character.dreams,
              inventoryItems: {
                create: character.items.map((item) => {
                  const template = REAL_ESTATE.find((r) => r.id === item.itemRef)!;
                  return {
                    itemRef: item.itemRef,
                    name: template.name,
                    purchasePrice: template.basePrice,
                    isInstallment: true,
                    monthlyPayment: template.monthlyPayment,
                    installmentsTotal: template.installmentMonths,
                    installmentsPaid: item.installmentsPaid,
                    special: template.special,
                  };
                }),
              },
            },
          },
        },
        include: { character: true },
      });
    });
  }

  async get(userId: string, gameId: string) {
    const game = await this.prisma.game.findFirst({
      where: { id: gameId, userId },
      include: { character: true },
    });

    if (!game) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }

    return game;
  }

  async update(userId: string, gameId: string, data: UpdateGameInput) {
    await this.get(userId, gameId);

    return this.prisma.game.update({
      where: { id: gameId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.status === GameStatus.COMPLETED && { completedAt: new Date() }),
      },
      include: { character: true },
    });
  }

  async delete(userId: string, gameId: string) {
    await this.get(userId, gameId);

    await this.prisma.game.delete({
      where: { id: gameId },
    });

    return { success: true };
  }
}
