import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  buildTestApp,
  closeTestApp,
  createTestUser,
  signTestToken,
  authHeader,
  createRefreshToken,
  type TestApp,
} from '../helpers.js';

describe('Auth module', () => {
  let app: TestApp;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await closeTestApp();
  });

  it('POST /auth/refresh returns 401 without refresh cookie', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'MISSING_REFRESH_TOKEN' },
    });
  });

  it('POST /auth/refresh returns new access token with valid refresh cookie', async () => {
    const user = await createTestUser();
    const refreshToken = 'valid-refresh-token-abc';

    await createRefreshToken(user.id, refreshToken);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { accessToken: string };
    expect(body.accessToken).toBeDefined();

    const setCookie = response.cookies.find((c) => c.name === 'refreshToken');
    expect(setCookie?.value).toBeDefined();
    expect(setCookie?.value).not.toBe(refreshToken);
  });

  it('POST /auth/refresh returns 401 for expired refresh token', async () => {
    const user = await createTestUser();
    const refreshToken = 'expired-refresh-token';

    await createRefreshToken(user.id, refreshToken, new Date(Date.now() - 1000));

    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'EXPIRED_REFRESH_TOKEN' },
    });
  });

  it('POST /auth/logout revokes refresh token and clears cookie', async () => {
    const user = await createTestUser();
    const refreshToken = 'logout-refresh-token';

    await createRefreshToken(user.id, refreshToken);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      cookies: { refreshToken },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ success: true });

    const refreshResponse = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      cookies: { refreshToken },
    });

    expect(refreshResponse.statusCode).toBe(401);
  });

  it('protected route returns 401 without token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
    });

    expect(response.statusCode).toBe(401);
  });

  it('protected route returns 401 with invalid token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: authHeader('invalid-token'),
    });

    expect(response.statusCode).toBe(401);
  });
});
