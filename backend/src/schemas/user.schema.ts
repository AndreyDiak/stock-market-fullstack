import { z } from 'zod';

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string(),
  avatarUrl: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lastLoginAt: z.string().datetime(),
});

export const updateUserBodySchema = z
  .object({
    displayName: z.string().min(1).max(100).optional(),
    avatarUrl: z.string().url().nullable().optional(),
  })
  .refine((data) => data.displayName !== undefined || data.avatarUrl !== undefined, {
    message: 'At least one field must be provided',
  });

export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
