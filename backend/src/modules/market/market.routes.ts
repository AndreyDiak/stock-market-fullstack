import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { errorResponses } from '../../schemas/register.js';
import { saveIdParamSchema } from '../saves/saves.schema.js';
import { buyStockBodySchema, sellStockBodySchema } from '../../schemas/stock.schema.js';
import { ipoSubscribeBodySchema } from '../../schemas/stock.schema.js';
import { MarketService } from './market.service.js';
import { AppError } from '../../utils/errors.js';

function mapIpo(row: {
  id: string;
  companyId: string;
  targetGrade: string;
  ipoPrice: number;
  ipoShares: number;
  announcedAtTurn: number;
  ipoAtTurn: number;
  minSubscription: number;
  maxSubscription: number;
  isCompleted: boolean;
  company: { ticker: string; name: string };
  subscriptions?: { amount: number }[];
}) {
  return {
    id: row.id,
    companyId: row.companyId,
    ticker: row.company.ticker,
    companyName: row.company.name,
    targetGrade: row.targetGrade,
    ipoPrice: row.ipoPrice,
    ipoShares: row.ipoShares,
    announcedAtTurn: row.announcedAtTurn,
    ipoAtTurn: row.ipoAtTurn,
    minSubscription: row.minSubscription,
    maxSubscription: row.maxSubscription,
    isCompleted: row.isCompleted,
    totalSubscribed: row.subscriptions?.reduce((sum, sub) => sum + sub.amount, 0),
  };
}

export async function marketRoutes(fastify: FastifyInstance) {
  const marketService = new MarketService(fastify.prisma);

  async function loadGame(userId: string, saveId: string) {
    const game = await fastify.prisma.game.findFirst({
      where: { id: saveId, userId },
      include: {
        character: {
          include: { inventoryItems: { orderBy: { purchasedAt: 'asc' } } },
        },
      },
    });

    if (!game?.character) {
      throw new AppError(404, 'GAME_NOT_FOUND', 'Game not found');
    }

    return { ...game, character: game.character };
  }

  fastify.get(
    '/saves/:id/stocks',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'StockListResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      const game = await loadGame(request.user.sub, id);
      const stocks = await marketService.listStocks(id, game.character);
      return { stocks };
    },
  );

  fastify.get(
    '/saves/:id/stocks/:listingId',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id', 'listingId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            listingId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: { $ref: 'StockDetailResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id, listingId } = request.params as { id: string; listingId: string };
      const game = await loadGame(request.user.sub, id);
      return marketService.getStockDetail(id, listingId, game.character);
    },
  );

  fastify.get(
    '/saves/:id/stocks/:listingId/history',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id', 'listingId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            listingId: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 20, default: 20 },
          },
        },
        response: {
          200: { $ref: 'StockHistoryResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id, listingId } = request.params as { id: string; listingId: string };
      const limit = Number((request.query as { limit?: number }).limit ?? 20);
      await loadGame(request.user.sub, id);
      const history = await marketService.getHistory(id, listingId, limit);
      return { history };
    },
  );

  fastify.post(
    '/saves/:id/stocks/:listingId/buy',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id', 'listingId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            listingId: { type: 'string', format: 'uuid' },
          },
        },
        body: { $ref: 'BuyStockBody#' },
        response: {
          200: { $ref: 'BuyStockResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id, listingId } = request.params as { id: string; listingId: string };
      const { quantity } = buyStockBodySchema.parse(request.body);
      const game = await loadGame(request.user.sub, id);
      const result = await marketService.buyStock(
        id,
        listingId,
        game.character,
        quantity,
        game.step,
      );

      return {
        balance: result.balance,
        portfolio: result.portfolio,
        news: result.news,
      };
    },
  );

  fastify.post(
    '/saves/:id/stocks/:listingId/sell',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id', 'listingId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            listingId: { type: 'string', format: 'uuid' },
          },
        },
        body: { $ref: 'SellStockBody#' },
        response: {
          200: { $ref: 'SellStockResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id, listingId } = request.params as { id: string; listingId: string };
      const { quantity } = sellStockBodySchema.parse(request.body);
      const game = await loadGame(request.user.sub, id);
      const result = await marketService.sellStock(
        id,
        listingId,
        game.character,
        quantity,
        game.step,
      );

      return {
        balance: result.balance,
        portfolio: result.portfolio,
        news: result.news,
        gross: result.gross,
        commissionPercent: result.commissionPercent,
        commissionAmount: result.commissionAmount,
        net: result.net,
      };
    },
  );

  fastify.get(
    '/saves/:id/portfolio',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'PortfolioResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      const game = await loadGame(request.user.sub, id);
      const portfolio = await marketService.getPortfolio(id, game.character);
      return { portfolio };
    },
  );

  fastify.get(
    '/saves/:id/market/sentiment',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'MarketSentiment#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      await loadGame(request.user.sub, id);
      return marketService.getMarketSentiment(id);
    },
  );

  fastify.get(
    '/saves/:id/market/sectors',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              sectors: {
                type: 'array',
                items: { $ref: 'SectorMomentum#' },
              },
            },
          },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      await loadGame(request.user.sub, id);
      const sectors = await marketService.getSectorMomentum(id);
      return { sectors };
    },
  );

  fastify.get(
    '/saves/:id/ipo',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'IpoListResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      await loadGame(request.user.sub, id);
      const rows = await marketService.ipo.listActive(id);
      return { ipos: rows.map(mapIpo) };
    },
  );

  fastify.get(
    '/saves/:id/ipo/history',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'IpoListResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      await loadGame(request.user.sub, id);
      const rows = await marketService.ipo.listHistory(id);
      return { ipos: rows.map(mapIpo) };
    },
  );

  fastify.post(
    '/saves/:id/ipo/:ipoId/subscribe',
    {
      preHandler: authenticate,
      schema: {
        tags: ['market'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id', 'ipoId'],
          properties: {
            id: { type: 'string', format: 'uuid' },
            ipoId: { type: 'string', format: 'uuid' },
          },
        },
        body: { $ref: 'IpoSubscribeBody#' },
        response: {
          200: { $ref: 'IpoSubscribeResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id, ipoId } = request.params as { id: string; ipoId: string };
      const { amount } = ipoSubscribeBodySchema.parse(request.body);
      const game = await loadGame(request.user.sub, id);
      const rows = await marketService.ipo.subscribeToIPO(id, ipoId, game.character, amount);
      return { ipos: rows.map(mapIpo) };
    },
  );
}
