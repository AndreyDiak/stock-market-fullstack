import type { Character, InventoryItem, PrismaClient } from '@prisma/client';
import { AppError } from '../../utils/errors.js';
import { countUnlockedPropertySlots, getSkillLevelFromCharacter, getSkillUpgradeCost } from './_calculations.js';
import { getSkillDefinition, SKILL_DEFINITIONS } from './_definitions.js';
import {
  buildCharacterSkillsState,
  getSkillLevelUpdateData,
  type CharacterSkillsState,
} from './_state.js';

type CharacterWithInventory = Character & { inventoryItems: InventoryItem[] };

export class CharacterSkillsService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  buildState(character: Character): CharacterSkillsState {
    return buildCharacterSkillsState(character);
  }

  async upgradeSkill(
    userId: string,
    saveId: string,
    skillId: string,
  ): Promise<{ character: CharacterWithInventory; characterSkills: CharacterSkillsState }> {
    const definition = getSkillDefinition(skillId);
    if (!definition) {
      throw new AppError(404, 'SKILL_NOT_FOUND', `Skill ${skillId} not found`);
    }

    const game = await this.#prisma.game.findFirst({
      where: { id: saveId, userId },
      include: {
        character: {
          include: {
            inventoryItems: {
              orderBy: { purchasedAt: 'asc' },
            },
          },
        },
      },
    });

    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }

    const character = game.character;
    const currentLevel = getSkillLevelFromCharacter(character, skillId);

    if (currentLevel >= definition.maxLevel) {
      throw new AppError(409, 'SKILL_MAXED', 'Skill is already at maximum level');
    }

    if (skillId === 'property_slots' && currentLevel >= definition.maxLevel) {
      throw new AppError(409, 'PROPERTY_SLOTS_MAXED', 'All property slots are unlocked');
    }

    const price = getSkillUpgradeCost(skillId, currentLevel, character.salary);
    if (price == null) {
      throw new AppError(409, 'SKILL_MAXED', 'Skill is already at maximum level');
    }
    if (character.balance < price) {
      throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance for skill upgrade');
    }

    const updateData = getSkillLevelUpdateData(skillId, currentLevel);
    if (!updateData) {
      throw new AppError(400, 'INVALID_SKILL', 'Invalid skill upgrade');
    }

    const updated = await this.#prisma.$transaction(async (tx) => {
      return tx.character.update({
        where: { id: character.id },
        data: {
          ...updateData,
          balance: { decrement: price },
          totalSpent: { increment: price },
        },
        include: {
          inventoryItems: {
            orderBy: { purchasedAt: 'asc' },
          },
        },
      });
    });

    return {
      character: updated,
      characterSkills: buildCharacterSkillsState(updated),
    };
  }

  getUnlockedPropertySlotCount(character: Character) {
    return countUnlockedPropertySlots(character.propertySlotLevel);
  }
}

export { SKILL_DEFINITIONS };
