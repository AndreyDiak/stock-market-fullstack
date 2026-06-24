import type { FastifyInstance, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/errors.js';
import { errorResponses } from '../../schemas/register.js';
import { fetchGoogleProfile, fetchYandexProfile, buildYandexAuthorizeUrl } from './oauth-providers.js';
import { createOAuthState } from './oauth-state.js';
import type { OAuthProfile } from './auth.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function getRefreshCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  };
}

async function completeOAuthLogin(
  authService: AuthService,
  reply: FastifyReply,
  profile: OAuthProfile,
) {
  const user = await authService.findOrCreateUser(profile);
  const tokens = await authService.issueTokens(user.id, user.email);

  reply.setCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshCookieOptions(tokens.expiresAt));

  const redirectUrl = new URL(`${env.CORS_ORIGIN}/auth/complete`);
  redirectUrl.searchParams.set('accessToken', tokens.accessToken);

  return reply.redirect(redirectUrl.toString());
}

function redirectOAuthError(reply: FastifyReply, error: string) {
  return reply.redirect(`${env.CORS_ORIGIN}/auth/complete?error=${encodeURIComponent(error)}`);
}

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify.prisma, fastify);

  fastify.get('/auth/yandex', async (_request, reply) => {
    const state = await createOAuthState(fastify);
    return reply.redirect(buildYandexAuthorizeUrl(state));
  });

  fastify.get('/auth/yandex/callback', async (request, reply) => {
    const query = request.query as { error?: string };

    if (query.error) {
      return redirectOAuthError(reply, query.error);
    }

    try {
      const { token } = await fastify.yandexOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      const profile = await fetchYandexProfile(token.access_token as string);
      return completeOAuthLogin(authService, reply, profile);
    } catch (error) {
      fastify.log.error(error);
      return redirectOAuthError(reply, 'authentication_failed');
    }
  });

  if (fastify.googleOAuth2) {
    fastify.get('/auth/google/callback', async (request, reply) => {
      const query = request.query as { error?: string };

      if (query.error) {
        return redirectOAuthError(reply, query.error);
      }

      try {
        const { token } = await fastify.googleOAuth2!.getAccessTokenFromAuthorizationCodeFlow(request);
        const profile = await fetchGoogleProfile(token.access_token as string);
        return completeOAuthLogin(authService, reply, profile);
      } catch (error) {
        fastify.log.error(error);
        return redirectOAuthError(reply, 'authentication_failed');
      }
    });
  }

  fastify.post(
    '/auth/refresh',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: { $ref: 'RefreshTokenResponse#' },
          ...errorResponses,
        },
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

      if (!refreshToken) {
        throw new AppError(401, 'MISSING_REFRESH_TOKEN', 'Refresh token cookie is missing');
      }

      const tokens = await authService.refreshAccessToken(refreshToken);

      reply.setCookie(REFRESH_COOKIE_NAME, tokens.refreshToken, getRefreshCookieOptions(tokens.expiresAt));

      return {
        accessToken: tokens.accessToken,
      };
    },
  );

  fastify.post(
    '/auth/logout',
    {
      schema: {
        tags: ['auth'],
        response: {
          200: { $ref: 'LogoutResponse#' },
        },
      },
    },
    async (request, reply) => {
      const refreshToken = request.cookies[REFRESH_COOKIE_NAME];

      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      reply.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });

      return { success: true };
    },
  );
}
