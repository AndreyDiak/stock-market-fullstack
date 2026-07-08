import { z } from 'zod';

export const createFeedbackBodySchema = z.object({
  saveId: z.string(),
  messageType: z.enum(['error', 'suggestion', 'feedback', 'other']),
  comment: z.string().min(1),
});

export const createFeedbackResponseSchema = z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export type CreateFeedbackBody = z.infer<typeof createFeedbackBodySchema>;
