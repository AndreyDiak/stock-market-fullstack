import type { MarketSector, PrismaClient, Sentiment } from '@prisma/client';
import { COMPANIES, type CompanyData } from '../../assets/companies.js';
import type { StaticNewsKind, StaticNewsTemplate } from '../../assets/news.js';
import { ensureCompanyByTicker } from '../market/company_catalog.js';
import {
  fillNewsTemplate,
  pickInsiderTurnsUntilImpact,
  pickStaticNews,
} from './news_picker.js';
import { ScheduledPriceImpactService } from '../market/scheduled_price_impact.service.js';
import {
  formatInsiderLead,
  resolveInsiderParams,
  templatePayload,
  toPersistedNewsItem,
} from './news_generation.utils.js';
import {
  calcInsiderNewsChancePercent,
  impactFromScore,
  sentimentFromScore,
  type InsiderScheduledImpactPayload,
  type PersistedNewsItem,
} from './types.js';

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
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
  readonly #scheduledPriceImpactService: ScheduledPriceImpactService;
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
    this.#scheduledPriceImpactService = new ScheduledPriceImpactService(prisma);
  }

  async generateTurnNews(input: {
    gameId: string;
    gameStep: number;
    professionLevel: number;
  }): Promise<{
    news: PersistedNewsItem[];
    insiderRolled: boolean;
    insiderChancePercent: number;
  }> {
    const insiderChancePercent = calcInsiderNewsChancePercent(input.professionLevel);
    const insiderRolled = Math.random() * 100 < insiderChancePercent;
    const baseCtx = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      company: pickRandom(COMPANIES),
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
  }): Promise<{ news: PersistedNewsItem; insiderRolled: true }> {
    const baseCtx = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      company: pickRandom(COMPANIES),
    };
    const item = await this.#generateStaticNews(baseCtx, this.#insiderNewsConfig());
    return { news: item, insiderRolled: true };
  }

  async generateJunkNews(input: {
    gameId: string;
    gameStep: number;
  }): Promise<PersistedNewsItem> {
    const baseCtx = {
      gameId: input.gameId,
      gameStep: input.gameStep,
      company: pickRandom(COMPANIES),
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

  async listGameNews(gameId: string, limit = 20): Promise<PersistedNewsItem[]> {
    const rows = await this.#prisma.news.findMany({
      where: { gameId },
      include: { company: true },
      orderBy: { publishedAt: 'desc' },
      take: limit,
    });

    return rows.map((row) => toPersistedNewsItem(row));
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
        const scheduled = await this.#scheduledPriceImpactService.schedule({
          gameId: ctx.gameId,
          ticker: ctx.company.ticker,
          newsId: item.id,
          direction: insider.direction,
          movePercent: insider.movePercent,
          createdAtStep: ctx.gameStep,
          turnsUntilImpact: insider.turnsUntilImpact,
        });

        const scheduledPayload: InsiderScheduledImpactPayload = {
          turnsUntilImpact: insider.turnsUntilImpact,
          triggerAtStep: scheduled.triggerAtStep,
          direction: insider.direction,
          movePercent: insider.movePercent,
          scheduledImpactId: scheduled.id,
        };

        return {
          ...item,
          payload: {
            templateId: template.id,
            expectedMovePercent: insider.expectedMovePercent,
            turnsUntilImpact: insider.turnsUntilImpact,
            scheduledImpact: scheduledPayload,
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
      payload: config.buildPayload(template, ctx, extra),
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

    return toPersistedNewsItem(row, {
      kind: input.kind,
      hot: input.hot,
      ticker: input.ticker,
      payload,
    });
  }
}
