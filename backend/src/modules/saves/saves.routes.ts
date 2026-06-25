import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { errorResponses } from '../../schemas/register.js';
import { createSaveSchema, saveIdParamSchema, updateSaveSchema } from './saves.schema.js';
import { SavesService } from './saves.service.js';

export async function savesRoutes(fastify: FastifyInstance) {
  const savesService = new SavesService(fastify.prisma);

  fastify.get(
    '/saves',
    {
      preHandler: authenticate,
      schema: {
        tags: ['saves'],
        security: [{ bearerAuth: [] }],
        response: {
          200: { $ref: 'GameList#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      return savesService.listSaves(request.user.sub);
    },
  );

  fastify.post(
    '/saves',
    {
      preHandler: authenticate,
      schema: {
        tags: ['saves'],
        security: [{ bearerAuth: [] }],
        body: { $ref: 'CreateGameBody#' },
        response: {
          201: { $ref: 'Game#' },
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      const data = createSaveSchema.parse(request.body);
      const game = await savesService.create(request.user.sub, data);
      return reply.status(201).send(game);
    },
  );

  fastify.get(
    '/saves/:id',
    {
      preHandler: authenticate,
      schema: {
        tags: ['saves'],
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
      const { id } = saveIdParamSchema.parse(request.params);
      return savesService.get(request.user.sub, id);
    },
  );

  fastify.patch(
    '/saves/:id',
    {
      preHandler: authenticate,
      schema: {
        tags: ['saves'],
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
      const { id } = saveIdParamSchema.parse(request.params);
      const data = updateSaveSchema.parse(request.body);
      return savesService.update(request.user.sub, id, data);
    },
  );

  fastify.delete(
    '/saves/:id',
    {
      preHandler: authenticate,
      schema: {
        tags: ['saves'],
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
      const { id } = saveIdParamSchema.parse(request.params);
      return savesService.delete(request.user.sub, id);
    },
  );
}
