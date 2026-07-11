import { randomBytes } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

export const OAUTH_STATE_PREFIX = 'oauth:state';
export const OAUTH_STATE_TTL_SECONDS = 600;

function createStateKey(state: string) {
  return `${OAUTH_STATE_PREFIX}:${state}`;
}

export async function createOAuthState(fastify: FastifyInstance): Promise<string> {
  const state = randomBytes(32).toString('hex');
  await fastify.redis.setex(createStateKey(state), OAUTH_STATE_TTL_SECONDS, '1');
  return state;
}

export async function validateOAuthState(
  fastify: FastifyInstance,
  state: string | undefined,
): Promise<boolean> {
  if (!state) {
    return false;
  }

  const key = createStateKey(state);
  const exists = await fastify.redis.get(key);
  if (!exists) {
    return false;
  }

  await fastify.redis.del(key);
  return true;
}

export function createOAuthStateHandlers(fastify: FastifyInstance) {
  return {
    generateStateFunction: async () => createOAuthState(fastify),
    checkStateFunction: async (request: { query: unknown }) => {
      const state = (request.query as { state?: string }).state;
      return validateOAuthState(fastify, state);
    },
  };
}
