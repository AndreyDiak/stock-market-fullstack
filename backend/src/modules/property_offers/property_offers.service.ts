import type { Character, InventoryItem, PrismaClient, PropertyOffer } from '@prisma/client';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import { NewsGenerationService } from '../news/news_generation.service.js';
import { AppError } from '../../utils/errors.js';
import { buildOfferParams, formatOfferNewsBody, getAssetName } from './_generator.js';
import {
  calcNegotiateTargetForOffer,
  calcProposedPrice,
  clampNegotiateAdjustment,
} from './_negotiate.js';
import {
  normalizeNegotiatePercent,
} from './_negotiate_discount.js';
import {
  applyEarlyInstallmentPayment,
  buildPropertySaleNewsFinance,
  calcDealProfitAmount,
  calcInstallmentEarlyPayAmount,
  calcInstallmentSaleBreakdown,
  calcPaidLoanAmount,
  calcReputationAfterSuccessfulTrade,
  calcSaleBalanceCredit,
  hasActiveInstallmentDebt,
  roundReputation,
  type PropertyOfferPaymentMode,
} from './_deal.js';
import { calcInstallmentTotalOwed } from './_installment_purchase.js';
import type { PersistedNewsItem } from '../news/types.js';
import type { PropertyOfferDto } from './_types.js';
import { calcDownPaymentAmount, calcDownPaymentPercent } from './_profit.js';
import { calcInstallmentPurchasePlan } from './_installment_purchase.js';
import type { ProfitGrade } from './_types.js';

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
      pendingNegotiatedPrice: offer.pendingNegotiatedPrice,
      pendingNegotiatedPercent: offer.pendingNegotiatedPercent,
    };
  }

  async listActive(
    gameId: string,
    bankingLevel: number,
    currentStep: number,
    inventoryItems: InventoryItem[] = [],
  ): Promise<PropertyOfferDto[]> {
    const offers = await this.#prisma.propertyOffer.findMany({
      where: { gameId, isActive: true },
      orderBy: [{ expiresAtTurn: 'asc' }, { createdAt: 'desc' }],
    });

    const ownedIds = new Set(inventoryItems.map((item) => item.id));
    const staleOfferIds: string[] = [];

    const activeOffers = offers.filter((offer) => {
      if (offer.expiresAtTurn <= currentStep) return false;

      if (offer.type === 'BUY') {
        if (!offer.inventoryItemId || !ownedIds.has(offer.inventoryItemId)) {
          staleOfferIds.push(offer.id);
          return false;
        }
      }

      return true;
    });

    if (staleOfferIds.length > 0) {
      await this.#prisma.propertyOffer.updateMany({
        where: { id: { in: staleOfferIds } },
        data: { isActive: false },
      });
    }

    const seenAssetIds = new Set<string>();
    const seenInventoryItemIds = new Set<string>();
    const dedupedOffers = [...activeOffers]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .filter((offer) => {
        if (offer.inventoryItemId) {
          if (seenInventoryItemIds.has(offer.inventoryItemId)) return false;
          seenInventoryItemIds.add(offer.inventoryItemId);
        }
        if (seenAssetIds.has(offer.assetId)) return false;
        seenAssetIds.add(offer.assetId);
        return true;
      })
      .sort((a, b) => a.expiresAtTurn - b.expiresAtTurn || b.createdAt.getTime() - a.createdAt.getTime());

    return dedupedOffers.map((offer) => this.serializeOffer(offer, bankingLevel, currentStep));
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
    const usedAssetIds: string[] = [];
    const usedInventoryItemIds: string[] = [];
    const existing = await this.#getActiveOfferExclusions(gameId, gameStep);
    usedAssetIds.push(...existing.assetIds);
    usedInventoryItemIds.push(...existing.inventoryItemIds);

    for (let i = 0; i < count; i++) {
      const params = buildOfferParams({
        gameId,
        gameStep,
        inventoryItems,
        excludeAssetIds: usedAssetIds,
        excludeInventoryItemIds: usedInventoryItemIds,
      });
      if (!params) continue;

      usedAssetIds.push(params.assetId);
      if (params.inventoryItemId) usedInventoryItemIds.push(params.inventoryItemId);

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
    const existing = await this.#getActiveOfferExclusions(gameId, gameStep);
    const usedAssetIds: string[] = [...existing.assetIds];
    const usedInventoryItemIds: string[] = [...existing.inventoryItemIds];

    for (const grade of starterGrades) {
      const params = buildOfferParams({
        gameId,
        gameStep,
        inventoryItems,
        forcedGrade: grade,
        excludeAssetIds: usedAssetIds,
        excludeInventoryItemIds: usedInventoryItemIds,
      });
      if (!params) continue;

      usedAssetIds.push(params.assetId);
      if (params.inventoryItemId) usedInventoryItemIds.push(params.inventoryItemId);

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

  async #getActiveOfferExclusions(
    gameId: string,
    currentStep: number,
  ): Promise<{ assetIds: string[]; inventoryItemIds: string[] }> {
    const activeOffers = await this.#prisma.propertyOffer.findMany({
      where: {
        gameId,
        isActive: true,
        expiresAtTurn: { gt: currentStep },
      },
      select: { assetId: true, inventoryItemId: true },
    });

    const assetIds = new Set<string>();
    const inventoryItemIds = new Set<string>();

    for (const offer of activeOffers) {
      assetIds.add(offer.assetId);
      if (offer.inventoryItemId) inventoryItemIds.add(offer.inventoryItemId);
    }

    return {
      assetIds: [...assetIds],
      inventoryItemIds: [...inventoryItemIds],
    };
  }

  async createWithNews(
    gameId: string,
    gameStep: number,
    inventoryItems: InventoryItem[],
  ): Promise<{ offer: PropertyOffer; news: PersistedNewsItem } | null> {
    const exclusions = await this.#getActiveOfferExclusions(gameId, gameStep);

    for (let attempt = 0; attempt < 10; attempt++) {
      const params = buildOfferParams({
        gameId,
        gameStep,
        inventoryItems,
        excludeAssetIds: exclusions.assetIds,
        excludeInventoryItemIds: exclusions.inventoryItemIds,
      });
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

      const news = await this.#newsService.createPropertyOfferNews({
        gameId,
        gameStep,
        offerId: offer.id,
        assetId: offer.assetId,
        body: formatOfferNewsBody(params),
      });

      return { offer, news };
    }

    return null;
  }

  async accept(
    _userId: string,
    gameId: string,
    offerId: string,
    character: CharacterWithInventory,
    currentStep: number,
    paymentMode: PropertyOfferPaymentMode = 'installment',
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
    news: PersistedNewsItem;
  }> {
    const offer = await this.#loadActiveOffer(gameId, offerId, currentStep);
    this.#assertSellOfferOwned(offer, character);

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

    if (type === 'SELL') {
      this.#validatePurchaseFunds(
        character,
        offer.offerPrice,
        offer.profitGrade as ProfitGrade,
        paymentMode,
      );
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

      await this.#executeOfferDeal(tx, offer, character, offer.offerPrice, paymentMode);
      await tx.propertyOffer.update({
        where: { id: offerId },
        data: { isActive: false },
      });
    });

    const updated = await this.#prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
    });

    const dealAction = type === 'SELL' ? 'purchased' : 'sold';
    const saleFinance =
      dealAction === 'sold' && owned
        ? buildPropertySaleNewsFinance(owned, offer.offerPrice)
        : undefined;
    const news = await this.#newsService.createPropertyDealNews({
      gameId,
      gameStep: currentStep,
      action: dealAction,
      itemName: getAssetName(offer.assetId),
      assetId: offer.assetId,
      price: offer.offerPrice,
      profitAmount,
      saleFinance,
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
        action: dealAction,
      },
      character: updated,
      news,
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
    news: PersistedNewsItem | null;
  }> {
    const offer = await this.#loadActiveOffer(gameId, offerId, currentStep);
    this.#assertSellOfferOwned(offer, character);
    const previousReputation = character.reputation;
    const previousBalance = character.balance;
    const clampedAdjustment = clampNegotiateAdjustment(adjustmentPercent);
    const effectiveAdjustment = normalizeNegotiatePercent(
      clampedAdjustment,
      character.tradingLevel,
    );

    await this.#prisma.propertyOffer.update({
      where: { id: offerId },
      data: {
        pendingNegotiatedPrice: null,
        pendingNegotiatedPercent: null,
      },
    });

    const target = calcNegotiateTargetForOffer(offer.type as 'BUY' | 'SELL', effectiveAdjustment);
    const d20 = rollDice ? rollDice() : 1 + Math.floor(Math.random() * 20);
    const roll = d20 + Math.floor(character.reputation);
    const success = roll >= target;

    if (!success) {
      const newReputation = roundReputation(Math.max(1, character.reputation - 0.1));
      await this.#prisma.character.update({
        where: { id: character.id },
        data: {
          reputation: newReputation,
          tradeSuccessStreak: 0,
        },
      });

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
        news: null,
      };
    }

    const type = offer.type as 'BUY' | 'SELL';
    const negotiatedPrice = calcProposedPrice(type, offer.offerPrice, effectiveAdjustment);

    await this.#prisma.propertyOffer.update({
      where: { id: offerId },
      data: {
        pendingNegotiatedPrice: negotiatedPrice,
        pendingNegotiatedPercent: effectiveAdjustment,
      },
    });

    return {
      success: true,
      d20,
      roll,
      target,
      negotiatedPrice,
      deal: null,
      previousReputation,
      reputation: character.reputation,
      previousBalance,
      balance: character.balance,
      character,
      news: null,
    };
  }

  async acceptNegotiated(
    _userId: string,
    gameId: string,
    offerId: string,
    character: CharacterWithInventory,
    currentStep: number,
    paymentMode: PropertyOfferPaymentMode = 'installment',
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
    news: PersistedNewsItem;
  }> {
    const offer = await this.#loadActiveOffer(gameId, offerId, currentStep);
    this.#assertSellOfferOwned(offer, character);

    if (offer.pendingNegotiatedPrice == null) {
      throw new AppError(400, 'NO_PENDING_NEGOTIATION', 'Нет согласованной цены для принятия');
    }

    if (character.bankingLevel < offer.requiredBankingLevel) {
      throw new AppError(403, 'BANKING_LEVEL_TOO_LOW', 'Banking level too low for this offer');
    }

    const negotiatedPrice = offer.pendingNegotiatedPrice;
    const previousBalance = character.balance;
    const previousReputation = character.reputation;
    const type = offer.type as 'BUY' | 'SELL';

    if (type === 'SELL') {
      this.#validatePurchaseFunds(
        character,
        negotiatedPrice,
        offer.profitGrade as ProfitGrade,
        paymentMode,
      );
    }

    const profitAmount = calcDealProfitAmount(type, negotiatedPrice, offer.marketPrice);
    const owned =
      type === 'BUY' && offer.inventoryItemId
        ? character.inventoryItems.find((item) => item.id === offer.inventoryItemId)
        : undefined;
    const installmentBreakdown =
      owned && type === 'BUY'
        ? calcInstallmentSaleBreakdown(owned, negotiatedPrice)
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

      await this.#executeOfferDeal(tx, offer, character, negotiatedPrice, paymentMode);
      await tx.propertyOffer.update({
        where: { id: offerId },
        data: {
          isActive: false,
          pendingNegotiatedPrice: null,
          pendingNegotiatedPercent: null,
        },
      });
    });

    const updated = await this.#prisma.character.findUniqueOrThrow({
      where: { id: character.id },
      include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
    });

    const dealAction = type === 'SELL' ? 'purchased' : 'sold';
    const saleFinance =
      dealAction === 'sold' && owned
        ? buildPropertySaleNewsFinance(owned, negotiatedPrice)
        : undefined;
    const news = await this.#newsService.createPropertyDealNews({
      gameId,
      gameStep: currentStep,
      action: dealAction,
      itemName: getAssetName(offer.assetId),
      assetId: offer.assetId,
      price: negotiatedPrice,
      profitAmount,
      saleFinance,
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
        price: negotiatedPrice,
        action: dealAction,
      },
      character: updated,
      news,
    };
  }

  async declineNegotiated(
    gameId: string,
    offerId: string,
    currentStep: number,
  ): Promise<void> {
    const offer = await this.#loadActiveOffer(gameId, offerId, currentStep);

    if (offer.pendingNegotiatedPrice == null) {
      return;
    }

    await this.#prisma.propertyOffer.update({
      where: { id: offerId },
      data: {
        pendingNegotiatedPrice: null,
        pendingNegotiatedPercent: null,
      },
    });
  }

  async #executeOfferDeal(
    tx: Pick<PrismaClient, 'character' | 'inventoryItem'>,
    offer: PropertyOffer,
    character: CharacterWithInventory,
    price: number,
    paymentMode: PropertyOfferPaymentMode = 'installment',
  ): Promise<void> {
    if (offer.type === 'SELL') {
      const asset = REAL_ESTATE.find((r) => r.id === offer.assetId);
      if (!asset) {
        throw new AppError(404, 'ASSET_NOT_FOUND', 'Asset not found');
      }

      if (paymentMode === 'full') {
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
            monthlyPayment: null,
            installmentsTotal: null,
            installmentsPaid: 0,
            isPaidOff: true,
            special: asset.special,
          },
        });

        return;
      }

      const downPaymentPercent = calcDownPaymentPercent(offer.profitGrade as ProfitGrade);
      const plan = calcInstallmentPurchasePlan({
        purchasePrice: price,
        downPaymentPercent,
        installmentsTotal: asset.installmentMonths,
        bankingLevel: character.bankingLevel,
      });

      if (character.balance < plan.downPayment) {
        throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Недостаточно средств для взноса');
      }

      await tx.character.update({
        where: { id: character.id },
        data: {
          balance: { decrement: plan.downPayment },
          totalSpent: { increment: plan.downPayment },
        },
      });

      await tx.inventoryItem.create({
        data: {
          characterId: character.id,
          itemRef: offer.assetId,
          name: asset.name,
          purchasePrice: price,
          downPaymentAmount: plan.downPayment,
          isInstallment: true,
          monthlyPayment: plan.monthlyPayment,
          installmentsTotal: plan.installmentsTotal,
          installmentsPaid: 0,
          isPaidOff: false,
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

    const balanceCredit = calcSaleBalanceCredit(owned, price);

    await tx.character.update({
      where: { id: character.id },
      data: {
        balance: { increment: balanceCredit },
        totalEarned: { increment: balanceCredit },
      },
    });

    await tx.inventoryItem.delete({ where: { id: offer.inventoryItemId } });
  }

  #validatePurchaseFunds(
    character: CharacterWithInventory,
    price: number,
    profitGrade: ProfitGrade,
    paymentMode: PropertyOfferPaymentMode,
  ): void {
    if (paymentMode === 'full') {
      if (character.balance < price) {
        throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Недостаточно средств для полной оплаты');
      }
      return;
    }

    const downPayment = calcDownPaymentAmount(price, calcDownPaymentPercent(profitGrade));
    if (character.balance < downPayment) {
      throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Недостаточно средств для взноса');
    }
  }

  #assertSellOfferOwned(offer: PropertyOffer, character: CharacterWithInventory): void {
    if (offer.type !== 'BUY') return;

    if (!offer.inventoryItemId) {
      throw new AppError(400, 'INVALID_OFFER', 'BUY offer missing inventory item');
    }

    const owned = character.inventoryItems.find((item) => item.id === offer.inventoryItemId);
    if (!owned) {
      throw new AppError(404, 'ITEM_NOT_OWNED', 'You do not own this property');
    }
  }

  async payOffInstallment(
    userId: string,
    gameId: string,
    itemId: string,
    payPercent: number,
  ) {
    const game = await this.#prisma.game.findFirst({
      where: { id: gameId, userId },
      include: {
        character: {
          include: {
            inventoryItems: { orderBy: { purchasedAt: 'asc' } },
          },
        },
      },
    });

    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }

    const item = game.character.inventoryItems.find((entry) => entry.id === itemId);
    if (!item) {
      throw new AppError(404, 'ITEM_NOT_FOUND', 'Inventory item not found');
    }

    if (!hasActiveInstallmentDebt(item)) {
      throw new AppError(400, 'NO_ACTIVE_DEBT', 'No active installment debt for this property');
    }

    const remaining = calcInstallmentTotalOwed(item) - calcPaidLoanAmount(item);
    const paymentAmount = calcInstallmentEarlyPayAmount(
      remaining,
      payPercent,
      game.character.balance,
    );

    if (paymentAmount <= 0) {
      throw new AppError(400, 'INSUFFICIENT_FUNDS', 'Недостаточно средств для досрочного погашения');
    }

    const applied = applyEarlyInstallmentPayment(item, paymentAmount);
    const previousBalance = game.character.balance;

    await this.#prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: game.character!.id },
        data: {
          balance: { decrement: applied.paymentAmount },
          totalSpent: { increment: applied.paymentAmount },
        },
      });

      await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          isPaidOff: applied.isPaidOff,
          installmentsPaid: applied.installmentsPaid,
          installmentPrepay: applied.installmentPrepay,
        },
      });
    });

    const news = await this.#newsService.createPropertyInstallmentNews({
      gameId,
      gameStep: game.step,
      itemRef: item.itemRef,
      itemName: item.name,
      amount: applied.paymentAmount,
      paidOff: applied.isPaidOff,
      installmentsPaidAfter: applied.installmentsPaid,
      installmentsTotal: item.installmentsTotal,
    });

    const character = await this.#prisma.character.findUniqueOrThrow({
      where: { id: game.character.id },
      include: {
        inventoryItems: { orderBy: { purchasedAt: 'asc' } },
      },
    });

    return {
      balance: character.balance,
      previousBalance,
      character,
      news,
    };
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
