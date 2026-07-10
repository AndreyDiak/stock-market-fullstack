import type { Character, InventoryItem, PrismaClient } from '@prisma/client';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import { ensureCompanyByTicker } from '../market/company_catalog.js';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { AppError } from '../../utils/errors.js';
import type { GeneratedDealOffer } from './deal.types.js';
import type { DealBundle } from './deal.types.js';

type CharacterWithInventory = Character & { inventoryItems: InventoryItem[] };

export class DealService {
  readonly #prisma: PrismaClient;
  readonly #newsService: NewsGenerationService;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#newsService = new NewsGenerationService(prisma);
  }

  async accept(
    gameId: string,
    gameStep: number,
    character: CharacterWithInventory,
    deal: GeneratedDealOffer,
  ) {
    if (deal.status !== 'ACTIVE') {
      throw new AppError(400, 'DEAL_NOT_ACTIVE', 'Deal offer is not active');
    }

    if (gameStep > deal.expiresTurn) {
      throw new AppError(410, 'DEAL_EXPIRED', 'Deal offer has expired');
    }

    if (character.reputation < deal.requiredReputation) {
      throw new AppError(403, 'REPUTATION_TOO_LOW',
        `Требуется репутация ${deal.requiredReputation}, у вас ${character.reputation.toFixed(1)}`,
      );
    }

    if (character.tradingLevel < deal.requiredTradingLevel) {
      throw new AppError(403, 'TRADING_LEVEL_TOO_LOW',
        `Требуется уровень трейдинга ${deal.requiredTradingLevel}, у вас ${character.tradingLevel}`,
      );
    }

    this.#validatePlayerCanGive(character, deal.playerGives);

    const previousBalance = character.balance;

    const updated = await this.#prisma.$transaction(async (tx) => {
      await this.#executeGive(tx, character, deal.playerGives, gameId);
      await this.#executeReceive(tx, character, deal.botGives, gameId);

      const reputationDelta = deal.playerBenefitPercent >= 0
        ? 0.2
        : -deal.reputationPenalty;
      const newReputation = Math.max(1, character.reputation + reputationDelta);

      return tx.character.update({
        where: { id: character.id },
        data: {
          reputation: Math.round(newReputation * 10) / 10,
          totalTrades: { increment: 1 },
          successfulTrades: { increment: 1 },
        },
      });
    });

    await this.#prisma.dealOffer.updateMany({
      where: { id: deal.id, gameId },
      data: { status: 'ACCEPTED' },
    });

    const finalCharacter = await this.#prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
    });

    const news = await this.#newsService.createDealNews({
      gameId,
      gameStep,
      deal,
    });

    return {
      balance: finalCharacter.balance,
      previousBalance,
      character: finalCharacter,
      news,
    };
  }

  #validatePlayerCanGive(character: CharacterWithInventory, playerGives: DealBundle) {
    for (const asset of playerGives.assets) {
      switch (asset.type) {
        case 'CASH':
          if (character.balance < (asset.cashAmount ?? 0)) {
            throw new AppError(400, 'INSUFFICIENT_FUNDS',
              `Недостаточно денег: нужно ${asset.cashAmount}, доступно ${character.balance}`,
            );
          }
          break;

        case 'STOCK':
          if (!asset.ticker || !asset.shares) {
            throw new AppError(400, 'INVALID_DEAL_ASSET', 'Invalid stock asset in deal');
          }
          break;

        case 'PROPERTY': {
          if (!asset.propertyId) {
            throw new AppError(400, 'INVALID_DEAL_ASSET', 'Invalid property asset in deal');
          }
          const owned = character.inventoryItems.find((i) => i.itemRef === asset.propertyId);
          if (!owned) {
            throw new AppError(404, 'PROPERTY_NOT_FOUND',
              `У вас нет недвижимости "${asset.propertyName ?? asset.propertyId}"`,
            );
          }
          if (owned.isInstallment && !owned.isPaidOff) {
            throw new AppError(400, 'PROPERTY_NOT_PAID_OFF',
              `Недвижимость "${asset.propertyName ?? asset.propertyId}" ещё не выкуплена. Нельзя обменять до полной выплаты.`,
            );
          }
          break;
        }
      }
    }
  }

  async #executeGive(
    tx: Pick<PrismaClient, 'character' | 'stock' | 'inventoryItem'>,
    character: CharacterWithInventory,
    bundle: DealBundle,
    gameId: string,
  ) {
    for (const asset of bundle.assets) {
      switch (asset.type) {
        case 'CASH': {
          const amount = asset.cashAmount ?? 0;
          await tx.character.update({
            where: { id: character.id },
            data: {
              balance: { decrement: amount },
              totalSpent: { increment: amount },
            },
          });
          break;
        }

        case 'STOCK': {
          const ticker = asset.ticker!;
          const shares = asset.shares!;
          const company = await ensureCompanyByTicker(this.#prisma, ticker);

          const holding = await tx.stock.findFirst({
            where: { ownerId: character.id, companyId: company.id, gameId },
          });

          if (!holding || holding.quantity < shares) {
            throw new AppError(400, 'INSUFFICIENT_STOCK',
              `Недостаточно акций ${ticker}: нужно ${shares}, доступно ${holding?.quantity ?? 0}`,
            );
          }

          if (holding.quantity === shares) {
            await tx.stock.delete({ where: { id: holding.id } });
          } else {
            await tx.stock.update({
              where: { id: holding.id },
              data: { quantity: { decrement: shares } },
            });
          }
          break;
        }

        case 'PROPERTY': {
          const propertyId = asset.propertyId!;
          const owned = character.inventoryItems.find((i) => i.itemRef === propertyId);
          if (!owned) {
            throw new AppError(404, 'PROPERTY_NOT_FOUND',
              `У вас нет недвижимости "${asset.propertyName ?? propertyId}"`,
            );
          }
          await tx.inventoryItem.delete({ where: { id: owned.id } });
          break;
        }
      }
    }
  }

  async #executeReceive(
    tx: Pick<PrismaClient, 'character' | 'stock' | 'inventoryItem'>,
    character: CharacterWithInventory,
    bundle: DealBundle,
    gameId: string,
  ) {
    for (const asset of bundle.assets) {
      switch (asset.type) {
        case 'CASH': {
          const amount = asset.cashAmount ?? 0;
          await tx.character.update({
            where: { id: character.id },
            data: {
              balance: { increment: amount },
              totalEarned: { increment: amount },
            },
          });
          break;
        }

        case 'STOCK': {
          const ticker = asset.ticker!;
          const shares = asset.shares!;
          const price = Math.round(asset.estimatedValue / shares);
          const company = await ensureCompanyByTicker(this.#prisma, ticker);

          const existing = await tx.stock.findFirst({
            where: { ownerId: character.id, companyId: company.id, gameId },
          });

          if (existing) {
            const nextQty = existing.quantity + shares;
            const nextPrice = Math.round(
              (existing.purchasePrice * existing.quantity + price * shares) / nextQty,
            );
            await tx.stock.update({
              where: { id: existing.id },
              data: { quantity: nextQty, purchasePrice: nextPrice },
            });
          } else {
            await tx.stock.create({
              data: {
                ownerId: character.id,
                companyId: company.id,
                gameId,
                purchasePrice: price,
                quantity: shares,
              },
            });
          }
          break;
        }

        case 'PROPERTY': {
          const propertyId = asset.propertyId!;
          const realEstate = REAL_ESTATE.find((r) => r.id === propertyId);
          if (!realEstate) throw new AppError(404, 'ASSET_NOT_FOUND', `Property ${propertyId} not found`);

          await tx.inventoryItem.create({
            data: {
              characterId: character.id,
              itemRef: propertyId,
              name: realEstate.name,
              purchasePrice: asset.estimatedValue,
              isInstallment: false,
              monthlyPayment: null,
              installmentsTotal: null,
              installmentsPaid: 0,
              isPaidOff: true,
              special: realEstate.special,
            },
          });
          break;
        }
      }
    }
  }
}
