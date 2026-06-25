import { GameStatus, Profession } from '@prisma/client';
import { z } from 'zod';
import { characterSchema } from './character.schema.js';

export const createGameBodySchema = z.object({
  name: z.string().min(1).max(100),
  slot: z.number().int().min(1).max(3),
  profession: z.nativeEnum(Profession),
});

export const updateGameBodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    status: z.nativeEnum(GameStatus).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const gameSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  slot: z.number().int(),
  status: z.nativeEnum(GameStatus),
  step: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  totalPlayTime: z.number().int(),
  character: characterSchema.nullable(),
});

export const gameListSchema = z.array(gameSchema);

export const deleteGameResponseSchema = z.object({
  success: z.boolean(),
});

export type CreateGameBody = z.infer<typeof createGameBodySchema>;
export type UpdateGameBody = z.infer<typeof updateGameBodySchema>;
export type Game = z.infer<typeof gameSchema>;
