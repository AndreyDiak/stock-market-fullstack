import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  buildTestApp,
  closeTestApp,
  createTestUser,
  signTestToken,
  authHeader,
  prisma,
  type TestApp,
} from '../helpers.js';

describe('Property offers API', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  async function createGame(userId: string, email: string) {
    const response = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: authHeader(signTestToken(app, userId, email)),
      payload: { slot: 2, profession: 'DEVELOPER', name: 'Property Test' },
    });
    expect(response.statusCode).toBe(201);
    return response.json() as { id: string };
  }

  it('creates F and E starter property offers on new game', async () => {
    const user = await createTestUser();
    const game = await createGame(user.id, user.email);

    const offers = await prisma.propertyOffer.findMany({
      where: { gameId: game.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(offers).toHaveLength(2);
    expect(offers.map((offer) => offer.profitGrade).sort()).toEqual(['E', 'F']);
  });

  it('returns property offers on dashboard', async () => {
    const user = await createTestUser();
    const game = await createGame(user.id, user.email);

    const response = await app.inject({
      method: 'GET',
      url: `/saves/${game.id}/dashboard`,
      headers: authHeader(signTestToken(app, user.id, user.email)),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { propertyOffers: { id: string }[] };
    expect(body.propertyOffers.length).toBeGreaterThan(0);
  });

  it('negotiate returns roll metadata', async () => {
    const user = await createTestUser();
    const game = await createGame(user.id, user.email);

    const offer = await prisma.propertyOffer.findFirstOrThrow({
      where: { gameId: game.id, isActive: true },
    });

    const response = await app.inject({
      method: 'POST',
      url: `/saves/${game.id}/property-offers/${offer.id}/negotiate`,
      headers: authHeader(signTestToken(app, user.id, user.email)),
      payload: { adjustmentPercent: 5 },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      success: boolean;
      d20: number;
      roll: number;
      target: number;
      negotiatedPrice: number | null;
      deal: { action: string } | null;
      previousReputation: number;
      reputation: number;
      previousBalance: number;
      balance: number;
      propertyOffers: unknown[];
      character: { reputation: number; balance: number };
    };

    expect(body.d20).toBeGreaterThanOrEqual(1);
    expect(body.d20).toBeLessThanOrEqual(20);
    expect(body.roll).toBeGreaterThanOrEqual(1);
    expect(body.target).toBe(10);
    expect(Array.isArray(body.propertyOffers)).toBe(true);
    expect(body.character.reputation).toBeGreaterThanOrEqual(1);
    expect(body.character.reputation).toBeLessThanOrEqual(10);
    if (body.success) {
      expect(body.deal).toBeNull();
      expect(body.negotiatedPrice).not.toBeNull();
      expect(body.balance).toBe(body.previousBalance);
    }
  });
});
