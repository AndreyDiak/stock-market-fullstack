import { z } from 'zod';
import { gameSchema } from './game.schema.js';
import { nextTurnForecastResponseSchema } from './forecast.schema.js';

const skillUpgradeBenefitSchema = z.object({
  id: z.string(),
  kind: z.enum(['compare', 'text', 'bonus']),
  label: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  suffix: z.string().optional(),
  fromTone: z.enum(['muted', 'emerald', 'amber']).optional(),
  toTone: z.enum(['emerald', 'amber']).optional(),
  text: z.string().optional(),
  highlight: z.string().optional(),
});

const skillInfographicChipSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string().optional(),
  moneyAmount: z.number().optional(),
  tone: z.enum(['emerald', 'amber']).optional(),
});

const skillLevelTooltipSchema = z.object({
  title: z.string(),
  lines: z.array(z.string()),
});

const skillUpgradePreviewSchema = z.object({
  skillName: z.string(),
  tag: z.string(),
  currentLevel: z.number().int(),
  nextLevel: z.number().int(),
  maxLevel: z.number().int(),
  price: z.number(),
  benefits: z.array(skillUpgradeBenefitSchema),
});

export const characterSkillSchema = z.object({
  id: z.string(),
  name: z.string(),
  tag: z.string(),
  description: z.string(),
  effectLabel: z.string(),
  level: z.number().int(),
  maxLevel: z.number().int(),
  upgradePrice: z.number().nullable(),
  canUpgrade: z.boolean(),
  infographic: z.array(skillInfographicChipSchema),
  upgradePreview: skillUpgradePreviewSchema.nullable(),
  segmentDisplay: z.object({
    filled: z.number().int(),
    total: z.number().int(),
  }),
  levelTooltips: z.array(skillLevelTooltipSchema),
});

export const characterStatsSchema = z.object({
  effectiveSalary: z.number(),
  workLevel: z.number().int(),
  insiderChancePercent: z.number(),
  bankBaseRatePercent: z.number(),
  tradingGrade: z.string(),
  sellCommissionPercent: z.number(),
  propertySlotsUnlocked: z.number().int(),
  salaryBonus: z.number(),
  qualificationBonusPercent: z.number().int(),
});

export const characterSkillsStateSchema = z.object({
  skills: z.array(characterSkillSchema),
  stats: characterStatsSchema,
});

export const upgradeSkillParamsSchema = z.object({
  id: z.string().uuid(),
  skillId: z.enum(['qualification', 'banking', 'trading', 'property_slots']),
});

export const upgradeSkillResponseSchema = z.object({
  game: gameSchema,
  characterSkills: characterSkillsStateSchema,
  nextTurnForecast: nextTurnForecastResponseSchema,
});

export type CharacterSkillsState = z.infer<typeof characterSkillsStateSchema>;
export type CharacterSkillDto = z.infer<typeof characterSkillSchema>;
export type CharacterStatsDto = z.infer<typeof characterStatsSchema>;
