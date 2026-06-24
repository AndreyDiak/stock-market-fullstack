import type { FastifyInstance } from 'fastify';
import { zodToOpenApiSchema } from './utils.js';
import { errorResponseSchema } from './error.schema.js';
import { characterSchema } from './character.schema.js';
import {
  characterRosterSchema,
} from './character-roster.schema.js';
import {
  createGameBodySchema,
  deleteGameResponseSchema,
  gameListSchema,
  gameSchema,
  updateGameBodySchema,
} from './game.schema.js';
import { updateUserBodySchema, userSchema } from './user.schema.js';
import { logoutResponseSchema, refreshTokenResponseSchema } from './auth.schema.js';

const schemaEntries = {
  ErrorResponse: errorResponseSchema,
  Character: characterSchema,
  CharacterRoster: characterRosterSchema,
  Game: gameSchema,
  GameList: gameListSchema,
  CreateGameBody: createGameBodySchema,
  UpdateGameBody: updateGameBodySchema,
  DeleteGameResponse: deleteGameResponseSchema,
  User: userSchema,
  UpdateUserBody: updateUserBodySchema,
  RefreshTokenResponse: refreshTokenResponseSchema,
  LogoutResponse: logoutResponseSchema,
} as const;

export const fastifyDefMap = Object.fromEntries(
  Object.keys(schemaEntries).map((id, index) => [`def-${index}`, id]),
);

export async function registerOpenApiSchemas(fastify: FastifyInstance) {
  for (const [id, schema] of Object.entries(schemaEntries)) {
    fastify.addSchema({
      $id: id,
      ...zodToOpenApiSchema(schema),
    });
  }
}

export const openApiComponentSchemas = Object.fromEntries(
  Object.entries(schemaEntries).map(([id, schema]) => [id, zodToOpenApiSchema(schema)]),
);

export const errorResponses = {
  400: { $ref: 'ErrorResponse#' },
  401: { $ref: 'ErrorResponse#' },
  404: { $ref: 'ErrorResponse#' },
  409: { $ref: 'ErrorResponse#' },
  500: { $ref: 'ErrorResponse#' },
} as const;
