import { buildApp } from '../src/app.js';
import { prisma } from './setup.js';

export type TestApp = Awaited<ReturnType<typeof buildApp>>;

let app: TestApp | null = null;

export async function buildTestApp(): Promise<TestApp> {
  if (!app) {
    app = await buildApp();
    await app.ready();
  }
  return app;
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}

export async function createTestUser(overrides?: {
  email?: string;
  yandexId?: string;
  googleId?: string;
  displayName?: string;
}) {
  return prisma.user.create({
    data: {
      email: overrides?.email ?? `test-${Date.now()}@example.com`,
      yandexId: overrides?.yandexId ?? `yandex-${Date.now()}`,
      googleId: overrides?.googleId,
      displayName: overrides?.displayName ?? 'Test User',
    },
  });
}

export function signTestToken(fastify: TestApp, userId: string, email: string): string {
  return fastify.jwt.sign({ sub: userId, email });
}

export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

export async function createRefreshToken(userId: string, token: string, expiresAt?: Date) {
  return prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: expiresAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
}

export { prisma };
