import { z } from 'zod';

export const dreamStageStatusSchema = z.enum(['LOCKED', 'ACTIVE', 'READY_TO_COMPLETE', 'COMPLETED']);

export const dreamStageRequirementSchema = z.object({
  description: z.string(),
  minBalance: z.number().optional(),
  minPortfolioValue: z.number().optional(),
  minPassiveIncome: z.number().optional(),
  minReputation: z.number().optional(),
  minProfessionLevel: z.number().optional(),
  minTradingLevel: z.number().optional(),
  minBankingLevel: z.number().optional(),
  requiredItems: z.array(z.string()).optional(),
  requireItemFullyOwned: z.array(z.string()).optional(),
  noActiveInstallments: z.boolean().optional(),
});

export const dreamStageResponseSchema = z.object({
  stageIndex: z.number().int(),
  status: dreamStageStatusSchema,
  requirement: dreamStageRequirementSchema,
  completedAt: z.string().datetime().nullable(),
  completedTurn: z.number().int().nullable(),
});

export const dreamResponseSchema = z.object({
  id: z.string().uuid(),
  dreamType: z.string(),
  title: z.string(),
  description: z.string(),
  currentStage: z.number().int(),
  stages: z.array(dreamStageResponseSchema),
});

export const completeStageBodySchema = z.object({
  dreamId: z.string().uuid(),
});

export const fulfillDreamBodySchema = z.object({
  dreamId: z.string().uuid(),
});

export type DreamStageStatus = z.infer<typeof dreamStageStatusSchema>;
export type DreamStageResponse = z.infer<typeof dreamStageResponseSchema>;
export type DreamResponse = z.infer<typeof dreamResponseSchema>;
export type CompleteStageBody = z.infer<typeof completeStageBodySchema>;
export type FulfillDreamBody = z.infer<typeof fulfillDreamBodySchema>;
