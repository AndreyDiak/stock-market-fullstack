import type { Character, PrismaClient } from '@prisma/client';
import { ensureCompanyByTicker } from '../market/company_catalog.js';
import { NewsGenerationService } from '../news/news_generation.service.js';
import type { GeneratedOtcDeal } from '../news/types.js';
import { AppError } from '../../utils/errors.js';

type CharacterWithInventory = Character & { inventoryItems: unknown[] };

export class OtcDealsService {
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
    deal: GeneratedOtcDeal,
  ) {
    const total = deal.qty * deal.price;
    const playerBuys = deal.side === 'sell';
    const playerAction = playerBuys ? 'buy' : 'sell';
    const company = await ensureCompanyByTicker(this.#prisma, deal.ticker);

    const updated = await this.#prisma.$transaction(async (tx) => {
      const current = await tx.character.findUniqueOrThrow({ where: { id: character.id } });

      if (playerBuys) {
        if (current.balance < total) {
          throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance for OTC deal');
        }

        const existing = await tx.stock.findFirst({
          where: { ownerId: character.id, companyId: company.id, gameId },
        });

        if (existing) {
          const nextQty = existing.quantity + deal.qty;
          const nextPrice =
            (existing.purchasePrice * existing.quantity + deal.price * deal.qty) / nextQty;
          await tx.stock.update({
            where: { id: existing.id },
            data: {
              quantity: nextQty,
              purchasePrice: nextPrice,
            },
          });
        } else {
          await tx.stock.create({
            data: {
              ownerId: character.id,
              companyId: company.id,
              gameId,
              purchasePrice: deal.price,
              quantity: deal.qty,
            },
          });
        }

        await tx.character.update({
          where: { id: character.id },
          data: {
            balance: { decrement: total },
            totalSpent: { increment: total },
            totalTrades: { increment: 1 },
            successfulTrades: { increment: 1 },
          },
        });
      } else {
        const holding = await tx.stock.findFirst({
          where: { ownerId: character.id, companyId: company.id, gameId },
        });

        if (!holding || holding.quantity < deal.qty) {
          throw new AppError(400, 'INSUFFICIENT_STOCK', 'Not enough shares for OTC deal');
        }

        if (holding.quantity === deal.qty) {
          await tx.stock.delete({ where: { id: holding.id } });
        } else {
          await tx.stock.update({
            where: { id: holding.id },
            data: { quantity: { decrement: deal.qty } },
          });
        }

        await tx.character.update({
          where: { id: character.id },
          data: {
            balance: { increment: total },
            totalEarned: { increment: total },
            totalTrades: { increment: 1 },
            successfulTrades: { increment: 1 },
          },
        });
      }

      return tx.character.findUniqueOrThrow({
        where: { id: character.id },
        include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
      });
    });

    const news = await this.#newsService.createStockTradeNews({
      gameId,
      gameStep,
      ticker: deal.ticker,
      companyName: deal.companyName,
      playerAction,
      qty: deal.qty,
      price: deal.price,
      botName: deal.botName,
    });

    return { character: updated, news, balance: updated.balance };
  }
}
