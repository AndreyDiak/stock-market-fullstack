import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import { prisma } from '../config/database.js';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export default fp(async (fastify) => {
  fastify.decorate('prisma', prisma);
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
  });
});
