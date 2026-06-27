import type { Character, InventoryItem, PrismaClient, PropertyOffer } from '@prisma/client';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { AppError } from '../../utils/errors.js';
import { buildOfferParams, formatOfferNewsBody, getAssetName } from './_generator.js';
import {
  calcNegotiateTarget,
  calcProposedPrice,
  clampNegotiateAdjustment,
} from './_negotiate.js';
import {
  calcDealProfitAmount,
  calcInstallmentSaleBreakdown,
  calcReputationAfterSuccessfulTrade,
} from './_deal.js';
import type { PropertyOfferDto } from './_types.js';
import { calcDownPaymentPercent } from './_profit.js';

type CharacterWithInventory = Character & { inventoryItems: InventoryItem[] };

export class PropertyOffersService {
  readonly #prisma: PrismaClient;
  readonly #newsService: NewsGenerationService;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#newsService = new NewsGenerationService(prisma);
  }

  serializeOffer(offer: PropertyOffer, bankingLevel: number, currentStep: number): PropertyOfferDto {
    const expiresInTurns = Math.max(0, offer.expiresAtTurn - currentStep);
    return {
      id: offer.id,
      assetId: offer.assetId,
      itemName: getAssetName(offer.assetId),
      inventoryItemId: offer.inventoryItemId,
      type: offer.type as PropertyOfferDto['type'],
      offerPrice: offer.offerPrice,
      marketPrice: offer.marketPrice,
      profitPercent: offer.profitPercent,
      profitGrade: offer.profitGrade as PropertyOfferDto['profitGrade'],
      requiredBankingLevel: offer.requiredBankingLevel,
      isHot: offer.isHot,
      expiresInTurns,
      isLocked: bankingLevel < offer.requiredBankingLevel,
      downPaymentPercent: calcDownPaymentPercent(offer.profitGrade as PropertyOfferDto['profitGrade']),
    };
  }

  async listActive(gameId: string, bankingLevel: number, currentStep: number): Promise<PropertyOfferDto[]> {
    const offers = await this.#prisma.propertyOffer.findMany({
      where: { gameId, isActive: true },
      orderBy: [{ expiresAtTurn: 'asc' }, { createdAt: 'desc' }],
    });

    return offers
      .filter((o) => o.expiresAtTurn > currentStep)
      .map((o) => this.serializeOffer(o, bankingLevel, currentStep));
  }

  async expireOffers(gameId: string, currentStep: number): Promise<void> {
    await this.#prisma.propertyOffer.updateMany({
      where: {
        gameId,
        isActive: true,
        expiresAtTurn: { lte: currentStep },
      },
      data: { isActive: false },
    });
  }

  async createOffers(
    gameId: string,
    gameStep: number,
    inventoryItems: InventoryItem[],
    count: number,
    withNews = false,
  ): Promise<PropertyOffer[]> {
    const created: PropertyOffer[] = [];

    for (let i = 0; i < count; i++) {
      const params = buildOfferParams({ gameId, gameStep, inventoryItems });
      if (!params) continue;

      const offer = await this.#prisma.propertyOffer.create({
        data: {
          gameId: params.gameId,
          assetId: params.assetId,
          inventoryItemId: params.inventoryItemId,
          type: params.type,
          offerPrice: params.offerPrice,
          marketPrice: params.marketPrice,
          profitPercent: params.profitPercent,
          profitGrade: params.profitGrade,
          requiredBankingLevel: params.requiredBankingLevel,
          isHot: params.isHot,
          expiresInTurns: params.expiresInTurns,
          expiresAtTurn: params.expiresAtTurn,
        },
      });

      created.push(offer);

      if (withNews) {
        await this.#newsService.createPropertyOfferNews({
          gameId,
          gameStep,
          offerId: offer.id,
          assetId: offer.assetId,
          body: formatOfferNewsBody(params),
        });
      }
    }

    return created;
  }

  async createStarterOffers(
    gameId: string,
    gameStep: number,
    inventoryItems: InventoryItem[],
  ): Promise<PropertyOffer[]> {
    const starterGrades = ['F', 'E'] as const;
    const created: PropertyOffer[] = [];
    const usedAssetIds: string[] = [];

    for (const grade of starterGrades) {
      const params = buildOfferParams({
        gameId,
        gameStep,
        inventoryItems,
        forcedGrade: grade,
        excludeAssetIds: usedAssetIds,
      });
      if (!params) continue;

      usedAssetIds.push(params.assetId);

      const offer = await this.#prisma.propertyOffer.create({
        data: {
          gameId: params.gameId,
          assetId: params.assetId,
          inventoryItemId: params.inventoryItemId,
          type: params.type,
          offerPrice: params.offerPrice,
          marketPrice: params.marketPrice,
          profitPercent: params.profitPercent,
          profitGrade: params.profitGrade,
          requiredBankingLevel: params.requiredBankingLevel,
          isHot: params.isHot,
          expiresInTurns: params.expiresInTurns,
          expiresAtTurn: params.expiresAtTurn,
        },
      });

      created.push(offer);
    }

    return created;
  }

  async createWithNews(
    gameId: string,
    gameStep: number,
    inventoryItems: InventoryItem[],
  ): Promise<PropertyOffer | null> {
    const offers = await this.createOffers(gameId, gameStep, inventoryItems, 1, true);
    return offers[0] ?? null;
  }

  async accept(
    _userId: string,
    gameId: string,
    offerId: string,
    character: CharacterWithInventory,
    currentStep: number,
  ): Promise<{
    balance: number;
    previousBalance: number;
    previousReputation: number;
    reputation: number;
    profitAmount: number;
    installmentBreakdown: ReturnType<typeof calcInstallmentSaleBreakdown>;
    deal: {
      assetId: string;
      itemName: string;
      type: 'BUY' | 'SELL';
      price: number;
      action: 'purchased' | 'sold';
    };
    character: CharacterWithInventory;
  }> {
    const offer = await this.#loadActiveOffer(gameId, offerId, currentStep);

    if (character.bankingLevel < offer.requiredBankingLevel) {
      throw new AppError(403, 'BANKING_LEVEL_TOO_LOW', 'Banking level too low for this offer');
    }

    const previousBalance = character.balance;
    const previousReputation = character.reputation;
    const type = offer.type as 'BUY' | 'SELL';
    const profitAmount = calcDealProfitAmount(type, offer.offerPrice, offer.marketPrice);
    const owned =
      type === 'BUY' && offer.inventoryItemId
        ? character.inventoryItems.find((item) => item.id === offer.inventoryItemId)
        : undefined;
    const installmentBreakdown =
      owned && type === 'BUY'
        ? calcInstallmentSaleBreakdown(owned, offer.offerPrice)
        : null;
    const { reputation: newReputation, tradeSuccessStreak: newStreak } =
      calcReputationAfterSuccessfulTrade(character.reputation, character.tradeSuccessStreak);

    await this.#prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: character.id },
        data: {
          reputation: newReputation,
          tradeSuccessStreak: newStreak,
        },
      });

      await this.#executeOfferDeal(tx, offer, character, offer.offerPrice);
      await tx.propertyOffer.update({
        where: { id: offerId },
        data: { isActive: false },
      });
    });

    const updated = await this.#prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
    });

    return {
      balance: updated.balance,
      previousBalance,
      previousReputation,
      reputation: newReputation,
      profitAmount,
      installmentBreakdown,
      deal: {
        assetId: offer.assetId,
        itemName: getAssetName(offer.assetId),
        type,
        price: offer.offerPrice,
        action: type === 'SELL' ? 'purchased' : 'sold',
      },
      character: updated,
    };
  }

  async negotiate(
    _userId: string,
    gameId: string,
    offerId: string,
    adjustmentPercent: number,
    character: CharacterWithInventory,
    currentStep: number,
    rollDice?: () => number,
  ): Promise<{
    success: boolean;
    d20: number;
    roll: number;
    target: number;
    negotiatedPrice: number | null;
    deal: {
      assetId: string;
      itemName: string;
      type: 'BUY' | 'SELL';
      price: number;
      action: 'purchased' | 'sold';
    } | null;
    previousReputation: number;
    reputation: number;
    previousBalance: number;
    balance: number;
    character: CharacterWithInventory;
  }> {
    const offer = await this.#loadActiveOffer(gameId, offerId, currentStep);
    const previousReputation = character.reputation;
    const previousBalance = character.balance;
    const clampedAdjustment = clampNegotiateAdjustment(adjustmentPercent);
    const target = calcNegotiateTarget(clampedAdjustment);
    const d20 = rollDice ? rollDice() : 1 + Math.floor(Math.random() * 20);
    const roll = d20 + Math.floor(character.reputation);
    const success = roll >= target;

    if (!success) {
      const newReputation = Math.max(1, character.reputation - 0.1);
      await this.#prisma.$transaction([
        this.#prisma.propertyOffer.update({
          where: { id: offerId },
          data: { isActive: false },
        }),
        this.#prisma.character.update({
          where: { id: character.id },
          data: {
            reputation: newReputation,
            tradeSuccessStreak: 0,
          },
        }),
      ]);

      const updated = await this.#prisma.character.findUniqueOrThrow({
        where: { id: character.id },
        include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
      });

      return {
        success: false,
        d20,
        roll,
        target,
        negotiatedPrice: null,
        deal: null,
        previousReputation,
        reputation: newReputation,
        previousBalance,
        balance: updated.balance,
        character: updated,
      };
    }

    const type = offer.type as 'BUY' | 'SELL';
    const negotiatedPrice = calcProposedPrice(type, offer.offerPrice, clampedAdjustment);

    if (type === 'SELL' && character.balance < negotiatedPrice) {
      throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance for negotiated price');
    }

    const { reputation: newReputation, tradeSuccessStreak: newStreak } =
      calcReputationAfterSuccessfulTrade(character.reputation, character.tradeSuccessStreak);

    await this.#prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: character.id },
        data: {
          reputation: newReputation,
          tradeSuccessStreak: newStreak,
        },
      });

      await this.#executeOfferDeal(tx, offer, character, negotiatedPrice);
      await tx.propertyOffer.update({
        where: { id: offerId },
        data: { isActive: false },
      });
    });

    const updated = await this.#prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
    });

    return {
      success: true,
      d20,
      roll,
      target,
      negotiatedPrice,
      deal: {
        assetId: offer.assetId,
        itemName: getAssetName(offer.assetId),
        type,
        price: negotiatedPrice,
        action: type === 'SELL' ? 'purchased' : 'sold',
      },
      previousReputation,
      reputation: newReputation,
      previousBalance,
      balance: updated.balance,
      character: updated,
    };
  }

  async #executeOfferDeal(
    tx: Pick<PrismaClient, 'character' | 'inventoryItem'>,
    offer: PropertyOffer,
    character: CharacterWithInventory,
    price: number,
  ): Promise<void> {
    if (offer.type === 'SELL') {
      if (character.balance < price) {
        throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Insufficient balance');
      }

      const asset = REAL_ESTATE.find((r) => r.id === offer.assetId);
      if (!asset) {
        throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found');
      }

      await tx.character.update({
        where: { id: character.id },
        data: {
          balance: { decrement: price },
          totalSpent: { increment: price },
        },
      });

      await tx.inventoryItem.create({
        data: {
          characterId: character.id,
          itemRef: offer.assetId,
          name: asset.name,
          purchasePrice: price,
          isInstallment: false,
          isPaidOff: true,
          special: asset.special,
        },
      });

      return;
    }

    if (!offer.inventoryItemId) {
      throw new AppError(400, 'INVALID_OFFER', 'BUY offer missing inventory item');
    }

    const owned = character.inventoryItems.find((i) => i.id === offer.inventoryItemId);
    if (!owned) {
      throw new AppError(404, 'ITEM_NOT_OWNED', 'You do not own this property');
    }

    await tx.character.update({
      where: { id: character.id },
      data: {
        balance: { increment: price },
        totalEarned: { increment: price },
      },
    });

    await tx.inventoryItem.delete({ where: { id: offer.inventoryItemId } });
  }

  async #loadActiveOffer(
    gameId: string,
    offerId: string,
    currentStep: number,
  ): Promise<PropertyOffer> {
    const offer = await this.#prisma.propertyOffer.findFirst({
      where: { id: offerId, gameId, isActive: true },
    });

    if (!offer) {
      throw new AppError(404, 'OFFER_NOT_FOUND', 'Property offer not found');
    }

    if (offer.expiresAtTurn <= currentStep) {
      throw new AppError(410, 'OFFER_EXPIRED', 'Property offer has expired');
    }

    return offer;
  }
}
