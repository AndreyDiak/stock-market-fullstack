import type { Character, Game, InventoryItem } from '@prisma/client';
import type { CharacterDto } from '../../schemas/character.schema.js';
import type { Game as GameDto } from '../../schemas/game.schema.js';

type CharacterWithInventory = Character & { inventoryItems: InventoryItem[] };
type GameWithCharacter = Game & { character: CharacterWithInventory | null };

function serializeInventoryItem(item: InventoryItem) {
  return {
    id: item.id,
    characterId: item.characterId,
    itemRef: item.itemRef,
    name: item.name,
    purchasePrice: item.purchasePrice,
    downPaymentAmount: item.downPaymentAmount,
    isInstallment: item.isInstallment,
    monthlyPayment: item.monthlyPayment,
    installmentsTotal: item.installmentsTotal,
    installmentsPaid: item.installmentsPaid,
    installmentPrepay: item.installmentPrepay,
    special: item.special,
    isPaidOff: item.isPaidOff,
    purchasedAt: item.purchasedAt.toISOString(),
  };
}

export function serializeCharacter(character: CharacterWithInventory): CharacterDto {
  return {
    id: character.id,
    gameId: character.gameId,
    name: character.name,
    balance: character.balance,
    profession: character.profession,
    professionLevel: character.professionLevel,
    salary: character.salary,
    reputation: character.reputation,
    tradingLevel: character.tradingLevel,
    bankingLevel: character.bankingLevel,
    propertySlotLevel: character.propertySlotLevel,
    isNpc: character.isNpc,
    dreamItemRefs: character.dreamItemRefs,
    totalEarned: character.totalEarned,
    totalSpent: character.totalSpent,
    totalTrades: character.totalTrades,
    successfulTrades: character.successfulTrades,
    createdAt: character.createdAt.toISOString(),
    updatedAt: character.updatedAt.toISOString(),
    inventoryItems: character.inventoryItems.map(serializeInventoryItem),
  };
}

export function serializeGame(game: GameWithCharacter): GameDto {
  return {
    id: game.id,
    userId: game.userId,
    name: game.name,
    slot: game.slot,
    status: game.status,
    step: game.step,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
    startedAt: game.startedAt?.toISOString() ?? null,
    completedAt: game.completedAt?.toISOString() ?? null,
    totalPlayTime: game.totalPlayTime,
    character: game.character ? serializeCharacter(game.character) : null,
  };
}
