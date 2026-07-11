import type { components, paths } from './schema';

export type ApiSchemas = components['schemas'];

export type Game = ApiSchemas['Game'];
export type GameList = ApiSchemas['GameList'];
export type User = ApiSchemas['User'];
export type Character = ApiSchemas['Character'];
export type CreateGameBody = ApiSchemas['CreateGameBody'];
export type Profession = CreateGameBody['profession'];

export type GetGamesResponse =
  paths['/saves']['get']['responses'][200]['content']['application/json'];

export type CreateGameResponse =
  paths['/saves']['post']['responses'][201]['content']['application/json'];

export type RefreshTokenResponse =
  paths['/auth/refresh']['post']['responses'][200]['content']['application/json'];

export type ApiError = ApiSchemas['ErrorResponse'];
