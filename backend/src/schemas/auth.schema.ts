import { z } from 'zod';

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});
