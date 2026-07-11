import type { PrismaClient } from '@prisma/client';
import { NewsGenerationService } from '../../news/news_generation.service.js';
import {
  pickNextContentType,
  type TurnContentType,
} from '../../news/news_cycle.js';
import type { GeneratedNewsKind } from '../../news/types.js';
import { PropertyOffersService } from '../../property_offers/property_offers.service.js';
import { DealGenerator } from '../../deals/deal.generator.js';
import { NPCS } from '../../../assets/npcs.js';
import { REAL_ESTATE } from '../../../assets/real_estate.js';
import type { TurnContext, TurnPhase, TurnState } from '../_types.js';

/** Фаза генерации контента хода: строгий цикл stock → deal → property */
export class TurnContentPhase implements TurnPhase {
  readonly id = 'turn-content';
  readonly #newsService: NewsGenerationService;
  readonly #propertyOffersService: PropertyOffersService;
  readonly #dealGenerator: DealGenerator;
  readonly #prisma: PrismaClient;
  readonly #pickContent: (lastKind: GeneratedNewsKind | null) => TurnContentType;

  constructor(
    prisma: PrismaClient,
    newsService: NewsGenerationService,
    propertyOffersService: PropertyOffersService,
    dealGenerator: DealGenerator,
    pickContent: (lastKind: GeneratedNewsKind | null) => TurnContentType = pickNextContentType,
  ) {
    this.#prisma = prisma;
    this.#newsService = newsService;
    this.#propertyOffersService = propertyOffersService;
    this.#dealGenerator = dealGenerator;
    this.#pickContent = pickContent;
  }

  async execute(context: TurnContext, state: TurnState): Promise<void> {
    const lastKind = await this.#newsService.getLatestCycleNewsKind(context.gameId);
    const contentType = this.#pickContent(lastKind);

    switch (contentType) {
      case 'property': {
        const result = await this.#propertyOffersService.createWithNews(
          context.gameId,
          context.game.step,
          context.game.character.inventoryItems,
        );
        if (result) {
          state.propertyOffersCreated = true;
          state.news.push(result.news);
        } else {
          const stock = await this.#newsService.generateStockNews({
            gameId: context.gameId,
            gameStep: context.game.step,
            profession: context.game.character.profession,
            professionLevel: context.game.character.professionLevel,
          });
          if (stock.insiderRolled) state.insiderRolled = true;
          state.news.push(stock.news);
        }
        break;
      }
      case 'deal': {
        const deal = await this.#generateDealOffer(context);
        state.dealOffer = deal;
        const news = await this.#newsService.createDealNews({
          gameId: context.gameId,
          gameStep: context.game.step,
          deal,
        });
        state.news.push(news);
        break;
      }
      case 'stock':
      default: {
        const stock = await this.#newsService.generateStockNews({
          gameId: context.gameId,
          gameStep: context.game.step,
          profession: context.game.character.profession,
          professionLevel: context.game.character.professionLevel,
        });
        if (stock.insiderRolled) state.insiderRolled = true;
        state.news.push(stock.news);
        break;
      }
    }
  }

  async #seedNpcs() {
    for (const npc of NPCS) {
      const exists = await this.#prisma.character.findFirst({
        where: { name: npc.name, isNpc: true },
      });
      if (exists) continue;

      await this.#prisma.character.create({
        data: {
          name: npc.name,
          profession: npc.profession,
          professionLevel: npc.professionLevel ?? 1,
          tradingLevel: npc.tradingLevel ?? 1,
          salary: npc.salary,
          balance: npc.balance,
          isNpc: true,
          dreamItemRefs: npc.dreams,
          inventoryItems: {
            create: npc.items.map((item) => {
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
      });
    }
  }

  async #generateDealOffer(context: TurnContext) {
    let npcs = await this.#prisma.character.findMany({
      where: { isNpc: true },
      include: { inventoryItems: true },
    });

    if (npcs.length === 0) {
      await this.#seedNpcs();
      npcs = await this.#prisma.character.findMany({
        where: { isNpc: true },
        include: { inventoryItems: true },
      });
    }

    for (const npc of npcs) {
      const seedData = NPCS.find((n) => n.name === npc.name);
      if (seedData && npc.tradingLevel !== seedData.tradingLevel) {
        await this.#prisma.character.update({
          where: { id: npc.id },
          data: { tradingLevel: seedData.tradingLevel },
        });
        npc.tradingLevel = seedData.tradingLevel;
      }
    }

    const playerName = context.game.character.name;
    const availableNpcs = npcs.filter((n) => n.name !== playerName);
    const npc = availableNpcs.length > 0
      ? availableNpcs[Math.floor(Math.random() * availableNpcs.length)]!
      : npcs[0];

    if (!npc) {
      throw new Error('Deal turn requires at least one NPC character');
    }

    const availableStocks = await this.#prisma.gameStockListing.findMany({
      where: { gameId: context.gameId, availableOnExchange: true },
      include: { company: true },
    });

    const playerStocks = await this.#prisma.stock.findMany({
      where: { ownerId: context.game.character.id, gameId: context.gameId },
      include: { company: true },
    });

    const deal = await this.#dealGenerator.maybeGenerate({
      gameId: context.gameId,
      gameStep: context.game.step,
      playerCharacter: context.game.character,
      npcCharacter: npc,
      availableStocks,
      playerStocks: playerStocks.map((s) => ({
        ticker: s.company.ticker,
        shares: s.quantity,
        listingId: s.companyId,
      })),
      playerProperties: context.game.character.inventoryItems
        .filter((item) => !item.isInstallment || item.isPaidOff)
        .map((item) => {
          const template = REAL_ESTATE.find((r) => r.id === item.itemRef);
          return {
            propertyId: item.itemRef,
            propertyName: template?.name ?? item.name,
            estimatedValue: template?.basePrice ?? item.purchasePrice,
          };
        }),
    });

    await this.#prisma.dealOffer.create({
      data: {
        id: deal.id,
        gameId: context.gameId,
        botCharacterId: npc.id,
        purpose: deal.purpose,
        botGives: deal.botGives as object,
        playerGives: deal.playerGives as object,
        requiredReputation: deal.requiredReputation,
        requiredTradingLevel: deal.requiredTradingLevel,
        reputationPenalty: deal.reputationPenalty,
        playerBenefitValue: deal.playerBenefitValue,
        playerBenefitPercent: deal.playerBenefitPercent,
        status: 'ACTIVE',
        turnCreated: deal.turnCreated,
        expiresTurn: deal.expiresTurn,
      },
    });

    return deal;
  }
}
