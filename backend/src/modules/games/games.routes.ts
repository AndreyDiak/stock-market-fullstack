import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { errorResponses } from '../../schemas/register.js';
import { createGameSchema, gameIdParamSchema, updateGameSchema } from './games.schema.js';
import { GamesService } from './games.service.js';

export async function gamesRoutes(fastify: FastifyInstance) {
  const gamesService = new GamesService(fastify.prisma);

  fastify.get(
    '/games',
    {
      preHandler: authenticate,
      schema: {
        tags: ['games'],
        security: [{ bearerAuth: [] }],
        response: {
          200: { $ref: 'GameList#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      return gamesService.listGames(request.user.sub);
    },
  );

  fastify.post(
    '/games',
    {
      preHandler: authenticate,
      schema: {
        tags: ['games'],
        security: [{ bearerAuth: [] }],
        body: { $ref: 'CreateGameBody#' },
        response: {
          201: { $ref: 'Game#' },
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      const data = createGameSchema.parse(request.body);
      const game = await gamesService.create(request.user.sub, data);
      return reply.status(201).send(game);
    },
  );

  fastify.get(
    '/games/:id',
    {
      preHandler: authenticate,
      schema: {
        tags: ['games'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'Game#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = gameIdParamSchema.parse(request.params);
      return gamesService.get(request.user.sub, id);
    },
  );

  fastify.patch(
    '/games/:id',
    {
      preHandler: authenticate,
      schema: {
        tags: ['games'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        body: { $ref: 'UpdateGameBody#' },
        response: {
          200: { $ref: 'Game#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = gameIdParamSchema.parse(request.params);
      const data = updateGameSchema.parse(request.body);
      return gamesService.update(request.user.sub, id, data);
    },
  );

  fastify.delete(
    '/games/:id',
    {
      preHandler: authenticate,
      schema: {
        tags: ['games'],
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string', format: 'uuid' } },
        },
        response: {
          200: { $ref: 'DeleteGameResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const { id } = gameIdParamSchema.parse(request.params);
      return gamesService.delete(request.user.sub, id);
    },
  );
}
