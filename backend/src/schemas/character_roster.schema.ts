import { Profession } from '@prisma/client';
import { z } from 'zod';

export const characterItemSchema = z.object({
  itemRef: z.string(),
  name: z.string(),
  basePrice: z.number(),
  monthlyPayment: z.number(),
  installmentsTotal: z.number(),
  installmentsPaid: z.number(),
});

export const characterDreamSchema = z.object({
  itemRef: z.string(),
  name: z.string(),
  description: z.string(),
  basePrice: z.number(),
});

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

export const characterDreamStagesSchema = z.object({
  dreamType: z.string(),
  title: z.string(),
  description: z.string(),
  stages: z.array(dreamStageRequirementSchema),
});

export const dreamRequirementPreviewKindSchema = z.enum([
  'balance',
  'profession',
  'portfolio',
  'banking',
  'trading',
  'passive',
  'reputation',
  'property',
  'no_installments',
]);

export const dreamRequirementPreviewSchema = z.object({
  kind: dreamRequirementPreviewKindSchema,
  label: z.string(),
});

export const characterDreamPreviewStageSchema = z.object({
  order: z.number().int(),
  title: z.string(),
  description: z.string(),
  requirementsPreview: z.array(dreamRequirementPreviewSchema),
  isFinal: z.boolean().optional(),
});

export const characterDreamPreviewSchema = z.object({
  title: z.string(),
  description: z.string(),
  stageCount: z.number().int(),
  pathHint: z.string(),
  stages: z.array(characterDreamPreviewStageSchema),
});

export const characterRosterItemSchema = z.object({
  profession: z.nativeEnum(Profession),
  name: z.string(),
  salary: z.number(),
  balance: z.number(),
  items: z.array(characterItemSchema),
  dreams: z.array(characterDreamSchema),
  dreamStages: characterDreamStagesSchema,
  dreamPreview: characterDreamPreviewSchema,
});

export const characterRosterSchema = z.array(characterRosterItemSchema);

export type CharacterRosterItem = z.infer<typeof characterRosterItemSchema>;
