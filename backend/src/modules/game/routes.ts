import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { errorResponses } from '../../schemas/register.js';
import { saveIdParamSchema } from '../saves/saves.schema.js';
import { endTurnBodySchema } from '../../schemas/turn.schema.js';
import { GameService } from './_service.js';

export async function gameRoutes(fastify: FastifyInstance) {
  const gameService = new GameService(fastify.prisma);

  fastify.post(
    '/saves/:id/end-turn',
    {
      preHandler: authenticate,
      schema: {
        tags: ['game'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: { $ref: 'EndTurnBody#' },
        response: {
          200: { $ref: 'EndTurnResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      const { expectedStep } = endTurnBodySchema.parse(request.body);
      return gameService.endTurn(request.user.sub, id, expectedStep);
    },
  );

  fastify.get(
    '/saves/:id/dashboard',
    {
      preHandler: authenticate,
      schema: {
        tags: ['game'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'GameDashboardResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      return gameService.getDashboard(request.user.sub, id);
    },
  );

  fastify.get(
    '/saves/:id/news',
    {
      preHandler: authenticate,
      schema: {
        tags: ['game'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'GameNewsResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      return gameService.getNews(request.user.sub, id);
    },
  );

  fastify.get(
    '/saves/:id/next-turn-forecast',
    {
      preHandler: authenticate,
      schema: {
        tags: ['game'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'NextTurnForecastResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = saveIdParamSchema.parse(request.params);
      return gameService.getNextTurnForecast(request.user.sub, id);
    },
  );
}
