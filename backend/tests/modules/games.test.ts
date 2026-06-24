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

describe('Games module', () => {
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

  it('POST /games creates game with character and dreams', async () => {
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/games',
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

  it('POST /games returns 409 for duplicate slot', async () => {
    const user = await createTestUser();

    const headers = await authForUser(user.id, user.email);
    const payload = {
      slot: 2,
      characterName: 'Character 1',
      profession: 'analyst',
    };

    const first = await app.inject({
      method: 'POST',
      url: '/games',
      headers,
      payload,
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/games',
      headers,
      payload: { ...payload, characterName: 'Character 2' },
    });

    expect(second.statusCode).toBe(409);
    expect(second.json()).toMatchObject({
      error: { code: 'SLOT_OCCUPIED' },
    });
  });

  it('POST /games returns 400 for invalid profession', async () => {
    const user = await createTestUser();

    const response = await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(user.id, user.email),
      payload: {
        slot: 1,
        characterName: 'Test',
        profession: 'invalid_profession',
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it('GET /games lists user games', async () => {
    const user = await createTestUser();

    await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 1, characterName: 'Char 1', profession: 'broker' },
    });

    await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 2, characterName: 'Char 2', profession: 'investor' },
    });

    const response = await app.inject({
      method: 'GET',
      url: '/games',
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as unknown[];
    expect(body).toHaveLength(2);
  });

  it('GET /games/:id returns game for owner', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 3, characterName: 'Owner Char', profession: 'day_trader' },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'GET',
      url: `/games/${game.id}`,
      headers: await authForUser(user.id, user.email),
    });

    expect(response.statusCode).toBe(200);
    expect((response.json() as { id: string }).id).toBe(game.id);
  });

  it('GET /games/:id returns 404 for other user game', async () => {
    const owner = await createTestUser();
    const other = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(owner.id, owner.email),
      payload: { slot: 1, characterName: 'Owner', profession: 'trader' },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'GET',
      url: `/games/${game.id}`,
      headers: await authForUser(other.id, other.email),
    });

    expect(response.statusCode).toBe(404);
  });

  it('PATCH /games/:id updates game', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 1, characterName: 'Char', profession: 'trader' },
    });

    const game = createResponse.json() as { id: string };

    const response = await app.inject({
      method: 'PATCH',
      url: `/games/${game.id}`,
      headers: await authForUser(user.id, user.email),
      payload: { name: 'Renamed Game', speed: 'FAST' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { name: string; speed: string };
    expect(body.name).toBe('Renamed Game');
    expect(body.speed).toBe('FAST');
  });

  it('DELETE /games/:id deletes game and cascades character', async () => {
    const user = await createTestUser();

    const createResponse = await app.inject({
      method: 'POST',
      url: '/games',
      headers: await authForUser(user.id, user.email),
      payload: { slot: 1, characterName: 'To Delete', profession: 'analyst' },
    });

    const game = createResponse.json() as { id: string; character: { id: string } };

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/games/${game.id}`,
      headers: await authForUser(user.id, user.email),
    });

    expect(deleteResponse.statusCode).toBe(200);

    const character = await prisma.character.findUnique({
      where: { id: game.character.id },
    });
    expect(character).toBeNull();
  });
});
