type LinearSkillPricing = {
  type: 'linear';
  basePrice: number;
  growthPerLevel: number;
};

type ExplicitSkillPricing = {
  type: 'explicit';
  pricesByTargetLevel: Record<number, number>;
};

export type SkillPricing = LinearSkillPricing | ExplicitSkillPricing;

export const SKILL_PRICING = {
  banking: {
    type: 'linear',
    basePrice: 6000,
    growthPerLevel: 0.4,
  },
  trading: {
    type: 'linear',
    basePrice: 7000,
    growthPerLevel: 0.5,
  },
  property_slots: {
    type: 'explicit',
    pricesByTargetLevel: {
      2: 15_000,
      3: 35_000,
      4: 70_000,
    },
  },
} as const;

export type PricedSkillId = keyof typeof SKILL_PRICING;
