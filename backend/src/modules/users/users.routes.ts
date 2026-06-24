import type { FastifyInstance } from 'fastify';
import { authenticate } from '../../middleware/authenticate.js';
import { errorResponses } from '../../schemas/register.js';
import { updateUserSchema } from './users.schema.js';
import { UsersService } from './users.service.js';

export async function usersRoutes(fastify: FastifyInstance) {
  const usersService = new UsersService(fastify.prisma);

  fastify.get(
    '/users/me',
    {
      preHandler: authenticate,
      schema: {
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        response: {
          200: { $ref: 'User#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      return usersService.getMe(request.user.sub);
    },
  );

  fastify.patch(
    '/users/me',
    {
      preHandler: authenticate,
      schema: {
        tags: ['users'],
        security: [{ bearerAuth: [] }],
        body: { $ref: 'UpdateUserBody#' },
        response: {
          200: { $ref: 'User#' },
          ...errorResponses,
        },
      },
    },
    async (request) => {
      const data = updateUserSchema.parse(request.body);
      return usersService.updateMe(request.user.sub, data);
    },
  );
}
