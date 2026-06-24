import type { FastifyInstance } from 'fastify';
import { errorResponses } from '../../schemas/register.js';
import { CharactersService } from './characters.service.js';

export async function charactersRoutes(fastify: FastifyInstance) {
  const charactersService = new CharactersService();

  fastify.get(
    '/characters',
    {
      schema: {
        tags: ['characters'],
        response: {
          200: { $ref: 'CharacterRoster#' },
          ...errorResponses,
        },
      },
    },
    async () => {
      return charactersService.listRoster();
    },
  );
}
