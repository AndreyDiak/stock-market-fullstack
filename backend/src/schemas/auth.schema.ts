import { z } from 'zod';

export const refreshTokenResponseSchema = z.object({
  accessToken: z.string(),
});

export const logoutResponseSchema = z.object({
  success: z.boolean(),
});

export const authTokenResponseSchema = refreshTokenResponseSchema;

export const registerBodySchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email(),
  password: z.string().min(8),
});

export const loginBodySchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});
