import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  buildTestApp,
  closeTestApp,
  createTestUser,
  signTestToken,
  authHeader,
  type TestApp,
} from '../helpers.js';
import { prisma } from '../setup.js';

describe('Saves module', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  async function authForUser(userId: string, email: string) {
    return authHeader(signTestToken(app, userId, email));
  }

  it('POST /saves creates game with character and dreams', async () => {
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 1,
        profession: 'DEVELOPER',
        name: 'My Game',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json() as {
      id: string;
      name: string;
      slot: number;
      character: {
        name: string;
        profession: string;
        balance: number;
        dreamItemRefs: string[];
      };
    };
    expect(body.name).toBe('My Game');
    expect(body.slot).toBe(1);
    expect(body.character.name).toBe('Алекс');
    expect(body.character.profession).toBe('DEVELOPER');
    expect(body.character.dreamItemRefs).toEqual(['penthouse', 'sport_car']);
  });

  it('POST /saves returns 409 for duplicate slot', async () => {
    const user = await createTestUser();

    const headers = await authForUser(user.id, user.email);
    const payload = {
      slot: 2,
      characterName: 'Character 1',
      profession: 'analyst',
    };

    const first = await app.inject({
      method: 'POST',
      url: '/saves',
      headers,
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/saves',
      headers,
      payload: { ...payload, characterName: 'Character 2' },
    });

    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({
      error: { code: 'SLOT_OCCUPIED' },
    });
  });

  it('POST /saves returns 400 for invalid profession', async () => {
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 1,
        characterName: 'Test',
        profession: 'invalid_profession',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('GET /saves lists user games', async () => {
    const user = await createTestUser();

    await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 1, characterName: 'Char 1', profession: 'broker' },
    });

    await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 2, characterName: 'Char 2', profession: 'investor' },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as unknown[];
    expect(body).toHaveLength(2);
  });

  it('GET /saves/:id returns game for owner', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 3, characterName: 'Owner Char', profession: 'day_trader' },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'GET',
      url: `/saves/${game.id}`,
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    expect((response.json() as { id: string }).id).toBe(game.id);
  });

  it('GET /saves/:id returns 404 for other user game', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(owner.id, owner.email),
      payload: { slot: 1, characterName: 'Owner', profession: 'trader' },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'GET',
      url: `/saves/${game.id}`,
      headers: await authForUser(other.id, other.email),
    });

    expect(response.statusCode).toBe(404);
  });

  it('PATCH /saves/:id updates game', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 1, characterName: 'Char', profession: 'trader' },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'PATCH',
      url: `/saves/${game.id}`,
      headers: await authForUser(user.id, user.email),
      payload: { name: 'Renamed Game', speed: 'FAST' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { name: string; speed: string };
    expect(body.name).toBe('Renamed Game');
    expect(body.speed).toBe('FAST');
  });

  it('DELETE /saves/:id deletes game and cascades character', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 1, characterName: 'To Delete', profession: 'analyst' },
    });

    const game = createResponse.json() as { id: string; character: { id: string } };

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/saves/${game.id}`,
      headers: await authForUser(user.id, user.email),
    });

    expect(deleteResponse.statusCode).toBe(200);

    const character = await prisma.character.findUnique({
      where: { id: game.character.id },
    });
    expect(character).toBeNull();
  });

  it('POST /saves creates one starter property and welcome news', async () => {
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 1,
        profession: 'ENGINEER',
        name: 'Starter Game',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json() as {
      id: string;
      character: { inventoryItems?: Array<{ itemRef: string }> };
    };

    expect(body.character.inventoryItems).toHaveLength(1);
    expect(body.character.inventoryItems?.[0]?.itemRef).toBe('garage');
    expect(body.character.reputation).toBe(3);
    expect(body.character.tradingLevel).toBe(1);

    const news = await prisma.news.findMany({ where: { gameId: body.id } });
    expect(news).toHaveLength(1);
    expect(news[0]?.kind).toBe('WELCOME');
    expect(news[0]?.title).toBe('Аккредитация трейдера');
    expect(news[0]?.body).toContain('аккредитации трейдера 1-го уровня');
  });

  it('GET /saves/:id/dashboard returns game, welcome news and forecast', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 1,
        profession: 'STREET_CLEANER',
        name: 'Dashboard Game',
      },
    });

    const created = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'GET',
      url: `/saves/${created.id}/dashboard`,
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      game: { character?: { inventoryItems?: Array<{ itemRef: string }> } };
      news: Array<{ kind: string }>;
      nextTurnForecast: { lines: unknown[] };
    };

    expect(body.game.character?.inventoryItems).toHaveLength(1);
    expect(body.news.some((item) => item.kind === 'WELCOME')).toBe(true);
    expect(body.nextTurnForecast.lines.length).toBeGreaterThan(0);
  });

  it('GET /saves/:id/next-turn-forecast returns salary and installment lines', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 2,
        profession: 'DEVELOPER',
        name: 'Forecast Game',
      },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'GET',
      url: `/saves/${game.id}/next-turn-forecast`,
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      lines: Array<{ id: string; amount: number }>;
      incomeTotal: number;
      expenseTotal: number;
      netChange: number;
    };

    expect(body.lines.some((line) => line.id === 'salary' && line.amount > 0)).toBe(false);
    expect(body.lines.some((line) => line.id.startsWith('living-') && line.amount < 0)).toBe(true);
    expect(body.lines.some((line) => line.id.startsWith('installment-') && line.amount < 0)).toBe(
      true,
    );
    expect(body.netChange).toBe(body.incomeTotal - body.expenseTotal);
  });

  it('GET /saves/:id/next-turn-forecast includes salary on turn 5', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/saves',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 3,
        profession: 'FINANCIER',
        name: 'Salary Turn Game',
      },
    });

    const game = createResponse.json() as { id: string };

    await prisma.game.update({
      where: { id: game.id },
      data: { step: 5 },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/saves/${game.id}/next-turn-forecast`,
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { lines: Array<{ id: string; amount: number }> };
    expect(body.lines.some((line) => line.id === 'salary' && line.amount > 0)).toBe(true);
  });
});
