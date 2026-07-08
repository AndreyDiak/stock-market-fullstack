import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type { Redis } from 'ioredis';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import errorHandlerPlugin from './plugins/error_handler.js';
import corsPlugin from './plugins/cors.js';
import prismaPlugin from './plugins/prisma.js';
import redisPlugin from './plugins/redis.js';
import authPlugin from './plugins/auth.js';
import rateLimitPlugin from './plugins/rate_limit.js';
import swaggerPlugin from './plugins/swagger.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { charactersRoutes } from './modules/characters/characters.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { savesRoutes } from './modules/saves/saves.routes.js';
import { gameRoutes } from './modules/game/routes.js';
import { marketRoutes } from './modules/market/market.routes.js';
import { feedbackRoutes } from './modules/feedback/feedback.routes.js';

export interface BuildAppOptions {
  openapiExport?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const fastify = Fastify({
    logger: options.openapiExport ? false : logger,
  });

  await fastify.register(errorHandlerPlugin);
  await fastify.register(swaggerPlugin);
  await fastify.register(corsPlugin);

  if (options.openapiExport) {
    fastify.decorate('prisma', {} as PrismaClient);
    fastify.decorate('redis', {
      setex: async () => 'OK',
      get: async () => null,
      del: async () => 1,
      ping: async () => 'PONG',
      quit: async () => 'OK',
    } as unknown as Redis);
    fastify.decorate('jwt', { sign: () => '' } as unknown as import('@fastify/jwt').JWT);
    fastify.decorate('yandexOAuth2', {
      getAccessTokenFromAuthorizationCodeFlow: async () => ({ token: { access_token: '' } }),
    } as unknown as import('@fastify/oauth2').OAuth2Namespace);
    fastify.decorate('googleOAuth2', {
      getAccessTokenFromAuthorizationCodeFlow: async () => ({ token: { access_token: '' } }),
    } as unknown as import('@fastify/oauth2').OAuth2Namespace);
  } else {
    await fastify.register(prismaPlugin);
    await fastify.register(redisPlugin);
    await fastify.register(authPlugin);
    await fastify.register(rateLimitPlugin);
  }

  await fastify.register(authRoutes);
  await fastify.register(charactersRoutes);
  await fastify.register(usersRoutes);
  await fastify.register(savesRoutes);
  await fastify.register(gameRoutes);
  await fastify.register(marketRoutes);
  await fastify.register(feedbackRoutes);

  fastify.get('/health', {
    schema: {
      tags: ['health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            postgres: { type: 'boolean' },
            redis: { type: 'boolean' },
          },
        },
      },
    },
  }, async () => {
    if (options.openapiExport) {
      return { status: 'ok', postgres: true, redis: true };
    }

    await fastify.prisma.$queryRaw`SELECT 1`;
    const redisPing = await fastify.redis.ping();

    return {
      status: 'ok',
      postgres: true,
      redis: redisPing === 'PONG',
    };
  });

  return fastify;
}

export { env };
