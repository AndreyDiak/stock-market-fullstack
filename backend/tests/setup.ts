import { config } from 'dotenv';

config();
process.env.NODE_ENV = 'test';

import { PrismaClient } from '@prisma/client';
import { beforeAll, afterAll, afterEach } from 'vitest';

const prisma = new PrismaClient();

async function truncateTables() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE "refresh_tokens", "characters", "games", "users" CASCADE;
  `);
}

beforeAll(async () => {
  await prisma.$connect();
});

afterEach(async () => {
  await truncateTables();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
