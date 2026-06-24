import { z } from 'zod';

export const refreshTokenBodySchema = z.object({}).optional();

export const authCallbackQuerySchema = z.object({
  code: z.string().optional(),
  state: z.string().optional(),
  error: z.string().optional(),
});

export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
