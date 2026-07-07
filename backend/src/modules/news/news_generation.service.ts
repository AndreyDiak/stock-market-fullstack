import type { MarketSector, PrismaClient, Profession, Sentiment } from '@prisma/client';
import { COMPANIES, type CompanyData } from '../../assets/companies.js';
import { buildAffectedSectors } from '../../assets/sector_spillover.js';
import {
  getInsiderSectorForProfession,
  professionHasInsiderAccess,
} from '../../assets/profession_sector.js';
import type { StaticNewsKind, StaticNewsTemplate } from '../../assets/news.js';
import { ensureCompanyByTicker } from '../market/company_catalog.js';
import { NewsImpactService } from '../market/news_impact.service.js';
import {
  formatPropertySaleNewsBody,
  type PropertySaleNewsFinance,
} from '../property_offers/_deal.js';
import {
  fillNewsTemplate,
  pickInsiderTurnsUntilImpact,
  pickStaticNews,
} from './news_picker.js';
import {
  formatInsiderLead,
  resolveInsiderParams,
  templatePayload,
  toPersistedNewsItem,
  sanitizePersistedNewsItem,
} from './news_generation.utils.js';
import {
  calcInsiderNewsChancePercent,
  impactFromScore,
  sentimentFromScore,
  type GeneratedNewsKind,
  type PersistedNewsItem,
  TURN_CYCLE_NEWS_KINDS,
} from './types.js';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function pickCompanyForSector(sector: MarketSector): CompanyData {
  const pool = COMPANIES.filter((company) => company.sector === sector);
  if (pool.length === 0) {
    return pickRandom(COMPANIES);
  }
  return pickRandom(pool);
}

function mapImpactStrengthToNewsLevel(strength: number): number {
  if (strength <= 3) return 1;
  if (strength <= 4) return 2;
  if (strength <= 6) return 3;
  if (strength <= 7) return 4;
  return 5;
}

type TurnNewsContext = {
  gameId: string;
  gameStep: number;
  company: CompanyData;
};

type PersistNewsInput = {
  gameId: string;
  gameStep: number;
  kind: PersistedNewsItem['kind'];
  title: string;
  body: string;
  sentiment: Sentiment;
  impact: number;
  sector?: MarketSector | null;
  ticker?: string;
  hot?: boolean;
  payload?: unknown;
  affectedSectors?: ReturnType<typeof buildAffectedSectors>;
};

type StaticNewsConfig<TExtra = undefined> = {
  kind: StaticNewsKind;
  salt: string;
  impactStrength: number;
  hot?: boolean;
  prepare?: (template: StaticNewsTemplate, ctx: TurnNewsContext) => TExtra;
  resolveSentiment: (template: StaticNewsTemplate) => Sentiment;
  buildBody: (template: StaticNewsTemplate, ctx: TurnNewsContext, extra: TExtra) => string;
  buildPayload: (
    template: StaticNewsTemplate,
    ctx: TurnNewsContext,
    extra: TExtra,
  ) => Record<string, unknown>;
  finalize?: (
    item: PersistedNewsItem,
    template: StaticNewsTemplate,
    ctx: TurnNewsContext,
    extra: TExtra,
  ) => Promise<PersistedNewsItem>;
};

export class NewsGenerationService {
  readonly #newsImpactService: NewsImpactService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#newsImpactService = new NewsImpactService(prisma);
  }

  async generateTurnNews(input: {
    gameId: string;
    gameStep: number;
    professionLevel: number;
    profession: Profession;
  }): Promise<{
    news: PersistedNewsItem[];
    insiderRolled: boolean;
    insiderChancePercent: number;
  }> {
    const insiderChancePercent = calcInsiderNewsChancePercent(input.professionLevel);
    const canRollInsider = professionHasInsiderAccess(input.profession);
    const insiderRolled =
      canRollInsider && Math.random() * 100 < insiderChancePercent;

    const insiderSector = getInsiderSectorForProfession(input.profession);
    const company = insiderRolled && insiderSector
      ? pickCompanyForSector(insiderSector)
      : pickRandom(COMPANIES);

    const baseCtx = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      company,
    };

    let item: PersistedNewsItem;
    if (insiderRolled) {
      item = await this.#generateStaticNews(baseCtx, this.#insiderNewsConfig());
    } else if (Math.random() < 0.35) {
      item = await this.#generateStaticNews(baseCtx, this.#rumorNewsConfig());
    } else {
      item = await this.#generateStaticNews(baseCtx, this.#marketNewsConfig());
    }

    return { news: [item], insiderRolled, insiderChancePercent };
  }

  async createWelcomeNews(gameId: string, characterName: string, tradingLevel = 1) {
    return this.#persistNews({
      gameId,
      gameStep: 1,
      kind: 'WELCOME',
      title: 'Аккредитация трейдера',
      body: `${characterName}, поздравляем с получением аккредитации трейдера ${tradingLevel}-го уровня! Теперь вам открыта торговля на бирже — следите за новостями, грамотно распоряжайтесь капиталом и удачи на рынке.`,
      sentiment: 'POSITIVE',
      impact: 0,
    });
  }

  async createPropertyOfferNews(input: {
    gameId: string;
    gameStep: number;
    offerId: string;
    assetId: string;
    body: string;
  }) {
    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'PROPERTY_OFFER',
      title: 'Новое предложение на рынке недвижимости!',
      body: input.body,
      sentiment: 'POSITIVE',
      impact: 0,
      hot: false,
      payload: { offerId: input.offerId, assetId: input.assetId },
    });
  }

  async generateInsiderNews(input: {
    gameId: string;
    gameStep: number;
    profession: Profession;
  }): Promise<{ news: PersistedNewsItem; insiderRolled: true }> {
    const sector = getInsiderSectorForProfession(input.profession);
    if (!sector) {
      throw new Error('Profession has no insider sector');
    }

    const baseCtx = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      company: pickCompanyForSector(sector),
    };
    const item = await this.#generateStaticNews(baseCtx, this.#insiderNewsConfig());
    return { news: item, insiderRolled: true };
  }

  async getLatestCycleNewsKind(gameId: string): Promise<GeneratedNewsKind | null> {
    const row = await this.#prisma.news.findFirst({
      where: {
        gameId,
        kind: { in: [...TURN_CYCLE_NEWS_KINDS] },
      },
      orderBy: { publishedAt: 'desc' },
      select: { kind: true },
    });
    return (row?.kind as GeneratedNewsKind | undefined) ?? null;
  }

  async createPropertyDealNews(input: {
    gameId: string;
    gameStep: number;
    action: 'purchased' | 'sold';
    itemName: string;
    assetId: string;
    price: number;
    profitAmount: number;
    saleFinance?: PropertySaleNewsFinance;
  }) {
    const isPurchase = input.action === 'purchased';
    const title = isPurchase ? `Покупка: ${input.itemName}` : `Продажа: ${input.itemName}`;
    const verb = isPurchase ? 'купили' : 'продали';
    const priceLabel = input.price.toLocaleString('ru-RU');
    const profitLabel =
      input.profitAmount > 0
        ? `Чистая выгода: +${input.profitAmount.toLocaleString('ru-RU')}.`
        : input.profitAmount < 0
          ? `Отклонение от рынка: ${input.profitAmount.toLocaleString('ru-RU')}.`
          : 'Сделка закрыта по рыночной цене.';

    const body =
      !isPurchase && input.saleFinance
        ? formatPropertySaleNewsBody(input.itemName, input.saleFinance)
        : `Вы ${verb} «${input.itemName}» за ${priceLabel}. ${profitLabel}`;

    const sentiment = !isPurchase && input.saleFinance
      ? input.saleFinance.priceDelta > 0
        ? 'POSITIVE'
        : input.saleFinance.priceDelta < 0
          ? 'NEGATIVE'
          : 'NEUTRAL'
      : input.profitAmount > 0
        ? 'POSITIVE'
        : input.profitAmount < 0
          ? 'NEGATIVE'
          : 'NEUTRAL';

    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'PROPERTY_DEAL',
      title,
      body,
      sentiment,
      impact: 0,
      payload: {
        assetId: input.assetId,
        itemName: input.itemName,
        action: input.action,
        price: input.price,
        profitAmount: input.profitAmount,
        saleFinance: input.saleFinance ?? null,
      },
    });
  }

  async createPropertyInstallmentNews(input: {
    gameId: string;
    gameStep: number;
    itemRef: string;
    itemName: string;
    amount: number;
    paidOff: boolean;
    installmentsPaidAfter: number;
    installmentsTotal: number | null;
  }) {
    const amountLabel = input.amount.toLocaleString('ru-RU');
    const title = input.paidOff
      ? `Ипотека погашена: ${input.itemName}`
      : `Платёж по ипотеке: ${input.itemName}`;

    const body = input.paidOff
      ? `Вы внесли последний платёж ${amountLabel} по «${input.itemName}». Объект теперь полностью ваш.`
      : input.installmentsTotal
        ? `Списано ${amountLabel} за «${input.itemName}». Платёж ${input.installmentsPaidAfter} из ${input.installmentsTotal}.`
        : `Списано ${amountLabel} за «${input.itemName}».`;

    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'PROPERTY_INSTALLMENT',
      title,
      body,
      sentiment: input.paidOff ? 'POSITIVE' : 'NEUTRAL',
      impact: 0,
      payload: {
        assetId: input.itemRef,
        itemName: input.itemName,
        amount: input.amount,
        paidOff: input.paidOff,
        installmentsPaid: input.installmentsPaidAfter,
        installmentsTotal: input.installmentsTotal,
      },
    });
  }

  async createStockTradeNews(input: {
    gameId: string;
    gameStep: number;
    ticker: string;
    companyName: string;
    playerAction: 'buy' | 'sell';
    qty: number;
    price: number;
    botName?: string;
    commissionPercent?: number;
    commissionAmount?: number;
    netProceeds?: number;
  }) {
    const total = input.qty * input.price;
    const totalLabel = total.toLocaleString('ru-RU');
    const priceLabel = input.price.toLocaleString('ru-RU');
    const isBuy = input.playerAction === 'buy';
    const title = isBuy ? `Покупка акций: ${input.ticker}` : `Продажа акций: ${input.ticker}`;
    const counterparty = input.botName ? ` у ${input.botName}` : '';
    let body = isBuy
      ? `Купили ${input.qty} акций ${input.companyName} (${input.ticker})${counterparty} по ${priceLabel} за штуку. Итого: ${totalLabel}.`
      : `Продали ${input.qty} акций ${input.companyName} (${input.ticker})${counterparty} по ${priceLabel} за штуку. Итого: ${totalLabel}.`;

    if (!isBuy && input.commissionPercent != null && input.commissionAmount != null && input.netProceeds != null) {
      const commissionLabel = input.commissionAmount.toLocaleString('ru-RU');
      const netLabel = input.netProceeds.toLocaleString('ru-RU');
      body += ` Комиссия (${input.commissionPercent}%): −${commissionLabel}. На баланс: +${netLabel}.`;
    }

    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'STOCK_TRADE',
      title,
      body,
      sentiment: 'NEUTRAL',
      impact: 0,
      ticker: input.ticker,
      payload: {
        ticker: input.ticker,
        companyName: input.companyName,
        playerAction: input.playerAction,
        qty: input.qty,
        price: input.price,
        total,
        botName: input.botName,
      },
    });
  }

  async generateStockNews(input: {
    gameId: string;
    gameStep: number;
    profession: Profession;
    professionLevel: number;
  }): Promise<{ news: PersistedNewsItem; insiderRolled: boolean }> {
    const insiderChancePercent = calcInsiderNewsChancePercent(input.professionLevel);
    const canRollInsider = professionHasInsiderAccess(input.profession);
    const insiderRolled =
      canRollInsider && Math.random() * 100 < insiderChancePercent;

    if (insiderRolled) {
      const { news } = await this.generateInsiderNews({
        gameId: input.gameId,
        gameStep: input.gameStep,
        profession: input.profession,
      });
      return { news, insiderRolled: true };
    }

    const news = await this.generateJunkNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      profession: input.profession,
    });
    return { news, insiderRolled: false };
  }

  async generateJunkNews(input: {
    gameId: string;
    gameStep: number;
    profession?: Profession;
  }): Promise<PersistedNewsItem> {
    const insiderSector = input.profession
      ? getInsiderSectorForProfession(input.profession)
      : null;
    const company =
      insiderSector && Math.random() < 0.35
        ? pickCompanyForSector(insiderSector)
        : pickRandom(COMPANIES);

    const baseCtx = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      company,
    };
    if (Math.random() < 0.35) {
      return this.#generateStaticNews(baseCtx, this.#rumorNewsConfig());
    }
    return this.#generateStaticNews(baseCtx, this.#marketNewsConfig());
  }

  async createOtcDealNews(input: {
    gameId: string;
    gameStep: number;
    deal: import('./types.js').GeneratedOtcDeal;
  }) {
    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'OTC_DEAL',
      title: `OTC-сделка: ${input.deal.companyName}`,
      body: input.deal.flavorText,
      sentiment: 'NEUTRAL',
      impact: 0,
      ticker: input.deal.ticker,
      payload: {
        botName: input.deal.botName,
        ticker: input.deal.ticker,
        side: input.deal.side,
        qty: input.deal.qty,
        price: input.deal.price,
        turnsLeft: input.deal.turnsLeft,
      },
    });
  }

  async createStockDividendNews(input: {
    gameId: string;
    gameStep: number;
    ticker: string;
    companyName: string;
  }) {
    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'STOCK_DIVIDEND',
      title: `Дивиденды: ${input.ticker}`,
      body: `${input.companyName} (${input.ticker}) выплатила дивиденды акционерам.`,
      sentiment: 'POSITIVE',
      impact: 0,
      ticker: input.ticker,
    });
  }

  async createIpoAnnounceNews(input: {
    gameId: string;
    gameStep: number;
    ticker: string;
    companyName: string;
    ipoPrice: number;
    ipoAtTurn: number;
  }) {
    const priceLabel = input.ipoPrice.toLocaleString('ru-RU');
    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'IPO_ANNOUNCE',
      title: `IPO: ${input.ticker}`,
      body: `${input.companyName} (${input.ticker}) готовится к размещению по ${priceLabel} за акцию. Подписка открыта до хода ${input.ipoAtTurn}.`,
      sentiment: 'POSITIVE',
      impact: 0.4,
      ticker: input.ticker,
      payload: {
        ticker: input.ticker,
        ipoPrice: input.ipoPrice,
        ipoAtTurn: input.ipoAtTurn,
      },
    });
  }

  async createIpoCompleteNews(input: {
    gameId: string;
    gameStep: number;
    ticker: string;
    companyName: string;
    ipoPrice: number;
  }) {
    const priceLabel = input.ipoPrice.toLocaleString('ru-RU');
    return this.#persistNews({
      gameId: input.gameId,
      gameStep: input.gameStep,
      kind: 'IPO_COMPLETE',
      title: `IPO завершено: ${input.ticker}`,
      body: `${input.companyName} (${input.ticker}) вышла на биржу по цене ${priceLabel}. Акции доступны для торговли.`,
      sentiment: 'POSITIVE',
      impact: 0.3,
      ticker: input.ticker,
      payload: {
        ticker: input.ticker,
        ipoPrice: input.ipoPrice,
      },
    });
  }

  async listGameNews(gameId: string, limit = 20): Promise<PersistedNewsItem[]> {
    const rows = await this.#prisma.news.findMany({
      where: { gameId },
      include: { company: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return rows.map((row) => sanitizePersistedNewsItem(toPersistedNewsItem(row)));
  }

  #marketNewsConfig(): StaticNewsConfig {
    return {
      kind: 'MARKET',
      salt: 'market',
      impactStrength: 6,
      resolveSentiment: (template) => sentimentFromScore(template.sentimentScore),
      buildBody: (template, ctx) => fillNewsTemplate(template.body, ctx.company),
      buildPayload: (template) => templatePayload(template),
    };
  }

  #rumorNewsConfig(): StaticNewsConfig {
    return {
      kind: 'RUMOR',
      salt: 'rumor',
      impactStrength: 3,
      resolveSentiment: () => 'NEUTRAL',
      buildBody: (template, ctx) => fillNewsTemplate(template.body, ctx.company),
      buildPayload: (template) => templatePayload(template),
    };
  }

  #insiderNewsConfig(): StaticNewsConfig<ReturnType<typeof resolveInsiderParams>> {
    return {
      kind: 'INSIDER',
      salt: 'insider',
      impactStrength: 8,
      hot: true,
      prepare: (template, ctx) =>
        resolveInsiderParams(
          template,
          ctx.gameId,
          ctx.gameStep,
          pickInsiderTurnsUntilImpact,
        ),
      resolveSentiment: (template) => sentimentFromScore(template.sentimentScore),
      buildBody: (template, ctx, insider) => {
        const lead = formatInsiderLead(
          ctx.company,
          insider.turnsUntilImpact,
          insider.direction,
          insider.movePercent,
        );

        return [lead, fillNewsTemplate(template.body, ctx.company), template.insiderInfo]
          .filter(Boolean)
          .join(' ');
      },
      buildPayload: (template, _ctx, insider) => ({
        templateId: template.id,
        expectedMovePercent: insider.expectedMovePercent,
        turnsUntilImpact: insider.turnsUntilImpact,
      }),
      finalize: async (item, template, ctx, insider) => {
        await this.#newsImpactService.createInsiderPressure({
          gameId: ctx.gameId,
          newsId: item.id,
          ticker: ctx.company.ticker,
          direction: insider.direction,
          movePercent: insider.movePercent,
          remainingTurns: insider.turnsUntilImpact,
        });

        return {
          ...item,
          payload: {
            templateId: template.id,
            expectedMovePercent: insider.expectedMovePercent,
            turnsUntilImpact: insider.turnsUntilImpact,
            triggerAtStep: ctx.gameStep + insider.turnsUntilImpact,
            direction: insider.direction,
            movePercent: insider.movePercent,
          },
        };
      },
    };
  }

  async #generateStaticNews<TExtra>(
    ctx: TurnNewsContext,
    config: StaticNewsConfig<TExtra>,
  ): Promise<PersistedNewsItem> {
    const template = pickStaticNews(
      config.kind,
      ctx.company.sector,
      ctx.gameId,
      ctx.gameStep,
      config.salt,
    );
    const extra = config.prepare?.(template, ctx) as TExtra;

    const affectedSectors = buildAffectedSectors(
      ctx.company.sector,
      template.secondarySectors,
    );

    const newsItem = await this.#persistNews({
      gameId: ctx.gameId,
      gameStep: ctx.gameStep,
      kind: config.kind,
      title: fillNewsTemplate(template.title, ctx.company),
      body: config.buildBody(template, ctx, extra),
      sentiment: config.resolveSentiment(template),
      impact: impactFromScore(template.sentimentScore, config.impactStrength),
      sector: ctx.company.sector,
      ticker: ctx.company.ticker,
      hot: config.hot,
      payload: {
        ...config.buildPayload(template, ctx, extra),
        primarySector: ctx.company.sector,
        affectedSectors,
        newsLevel: mapImpactStrengthToNewsLevel(config.impactStrength),
      },
      affectedSectors,
    });

    return config.finalize ? config.finalize(newsItem, template, ctx, extra) : newsItem;
  }

  async #resolveCompanyId(ticker?: string) {
    if (!ticker) return null;
    const company = await ensureCompanyByTicker(this.#prisma, ticker);
    return company.id;
  }

  async #persistNews(input: PersistNewsInput): Promise<PersistedNewsItem> {
    const companyId = await this.#resolveCompanyId(input.ticker);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const payload = {
      ...((input.payload as Record<string, unknown> | undefined) ?? {}),
      publishedStep: input.gameStep,
    };

    const row = await this.#prisma.news.create({
      data: {
        gameId: input.gameId,
        kind: input.kind,
        title: input.title,
        body: input.body,
        sentiment: input.sentiment,
        impact: input.impact,
        sector: input.sector ?? undefined,
        companyId: companyId ?? undefined,
        expiresAt,
        payload,
      },
      include: { company: true },
    });

    if (input.kind === 'MARKET' || input.kind === 'RUMOR') {
      await this.#newsImpactService.applyNews({
        id: row.id,
        gameId: input.gameId,
        kind: input.kind,
        impact: input.impact,
        sentiment: input.sentiment,
        sector: row.sector,
        companyId: row.companyId,
        affectedSectors: input.affectedSectors,
      });
    }

    return sanitizePersistedNewsItem(
      toPersistedNewsItem(row, {
        kind: input.kind,
        hot: input.hot,
        ticker: input.ticker,
        payload,
      }),
    );
  }
}
