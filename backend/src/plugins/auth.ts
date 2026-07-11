import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import fastifyOauth2 from '@fastify/oauth2';
import fp from 'fastify-plugin';
import { env } from '../config/env.js';
import { createOAuthStateHandlers } from '../modules/auth/oauth_state.js';

export interface JwtPayload {
  sub: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: import('fastify').FastifyRequest, reply: import('fastify').FastifyReply) => Promise<void>;
    yandexOAuth2: fastifyOauth2.OAuth2Namespace;
    googleOAuth2?: fastifyOauth2.OAuth2Namespace;
  }

  interface FastifyRequest {
    user: JwtPayload;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}

const YANDEX_OAUTH_CONFIG = {
  authorizeHost: 'https://oauth.yandex.ru',
  authorizePath: '/authorize',
  tokenHost: 'https://oauth.yandex.ru',
  tokenPath: '/token',
};

const GOOGLE_OAUTH_CONFIG = {
  authorizeHost: 'https://accounts.google.com',
  authorizePath: '/o/oauth2/v2/auth',
  tokenHost: 'https://www.googleapis.com',
  tokenPath: '/oauth2/v4/token',
};

export default fp(async (fastify) => {
  await fastify.register(cookie);

  await fastify.register(jwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    },
  });

  const oauthStateHandlers = createOAuthStateHandlers(fastify);

  await fastify.register(fastifyOauth2, {
    name: 'yandexOAuth2',
    credentials: {
      client: {
        id: env.YANDEX_CLIENT_ID,
        secret: env.YANDEX_CLIENT_SECRET,
      },
      auth: YANDEX_OAUTH_CONFIG,
    },
    startRedirectPath: undefined,
    callbackUri: env.YANDEX_CALLBACK_URL,
    ...oauthStateHandlers,
  });

  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL) {
    await fastify.register(fastifyOauth2, {
      name: 'googleOAuth2',
      credentials: {
        client: {
          id: env.GOOGLE_CLIENT_ID,
          secret: env.GOOGLE_CLIENT_SECRET,
        },
        auth: GOOGLE_OAUTH_CONFIG,
      },
      startRedirectPath: '/auth/google',
      callbackUri: env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
      ...oauthStateHandlers,
    });
  }

  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch {
      return reply.status(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token',
        },
      });
    }
  });
});
