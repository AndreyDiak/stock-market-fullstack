import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  buildTestApp,
  closeTestApp,
  createTestUser,
  signTestToken,
  authHeader,
  type TestApp,
} from '../helpers.js';

describe('Users module', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('GET /users/me returns current user profile', async () => {
    const user = await createTestUser({ displayName: 'John Doe' });
    const token = signTestToken(app, user.id, user.email);

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: authHeader(token),
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { id: string; email: string; displayName: string };
    expect(body.id).toBe(user.id);
    expect(body.email).toBe(user.email);
    expect(body.displayName).toBe('John Doe');
  });

  it('PATCH /users/me updates displayName', async () => {
    const user = await createTestUser();
    const token = signTestToken(app, user.id, user.email);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: authHeader(token),
      payload: { displayName: 'Updated Name' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { displayName: string };
    expect(body.displayName).toBe('Updated Name');
  });

  it('PATCH /users/me returns 400 for empty body', async () => {
    const user = await createTestUser();
    const token = signTestToken(app, user.id, user.email);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: authHeader(token),
      payload: {},
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('PATCH /users/me returns 400 for invalid avatarUrl', async () => {
    const user = await createTestUser();
    const token = signTestToken(app, user.id, user.email);

    const response = await app.inject({
      method: 'PATCH',
      url: '/users/me',
      headers: authHeader(token),
      payload: { avatarUrl: 'not-a-url' },
    });

    expect(response.statusCode).toBe(400);
  });
});
