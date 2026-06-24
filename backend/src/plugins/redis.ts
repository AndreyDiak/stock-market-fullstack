import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { createRedisClient } from '../config/redis.js';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export default fp(async (fastify) => {
  const redis = createRedisClient();
  await redis.connect();

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
  });
});
