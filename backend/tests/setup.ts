import { config } from 'dotenv';

config();
process.env.NODE_ENV = 'test';

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { beforeAll, afterAll, afterEach } from 'vitest';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for tests');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

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
