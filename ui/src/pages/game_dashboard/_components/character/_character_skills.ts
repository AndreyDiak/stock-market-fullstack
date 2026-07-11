export const TRADING_GRADES = ['F', 'E', 'D', 'C', 'B', 'A'] as const

export interface SkillUpgradeBenefit {
  id: string
  kind: 'compare' | 'text' | 'bonus'
  label: string
  from?: string
  to?: string
  suffix?: string
  fromTone?: 'muted' | 'emerald' | 'amber'
  toTone?: 'emerald' | 'amber'
  text?: string
  highlight?: string
}

export interface SkillInfographicChip {
  id: string
  label: string
  value?: string
  moneyAmount?: number
  tone?: 'emerald' | 'amber'
}

export interface SkillLevelTooltip {
  title: string
  lines: string[]
}

export interface SkillUpgradePreview {
  skillName: string
  tag: string
  currentLevel: number
  nextLevel: number
  maxLevel: number
  price: number
  benefits: SkillUpgradeBenefit[]
}

export interface CharacterSkill {
  id: string
  name: string
  tag: string
  description: string
  effectLabel: string
  level: number
  maxLevel: number
  upgradePrice: number | null
  canUpgrade: boolean
  infographic: SkillInfographicChip[]
  upgradePreview: SkillUpgradePreview | null
  segmentDisplay: { filled: number; total: number }
  levelTooltips: SkillLevelTooltip[]
}

export interface CharacterStats {
  effectiveSalary: number
  workLevel: number
  insiderChancePercent: number
  bankBaseRatePercent: number
  tradingGrade: string
  sellCommissionPercent: number
  propertySlotsUnlocked: number
  salaryBonus: number
  qualificationBonusPercent: number
}

export interface CharacterSkillsState {
  skills: CharacterSkill[]
  stats: CharacterStats
}

export const EMPTY_CHARACTER_STATS: CharacterStats = {
  effectiveSalary: 0,
  workLevel: 1,
  insiderChancePercent: 2,
  bankBaseRatePercent: 20,
  tradingGrade: 'F',
  sellCommissionPercent: 10,
  propertySlotsUnlocked: 1,
  salaryBonus: 0,
  qualificationBonusPercent: 0,
}

export const EMPTY_CHARACTER_SKILLS_STATE: CharacterSkillsState = {
  skills: [],
  stats: EMPTY_CHARACTER_STATS,
}

export function getSkillLevel(skills: CharacterSkill[], skillId: string) {
  return skills.find((skill) => skill.id === skillId)?.level ?? 1
}

/** Комиссия при продаже акций для уровня трейдинга (F→10% … A→5%). */
export function calcSellCommissionPercent(tradingLevel: number): number {
  const level = Math.max(1, Math.min(tradingLevel, 6))
  return 10 - (level - 1)
}

/** Макс. скидка при торге по имуществу для уровня курса трейдинга (F→15% … A→50%). */
const MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL = {
  1: 15,
  2: 25,
  3: 30,
  4: 35,
  5: 42,
  6: 50,
} as const

export function getMaxNegotiateDiscountPercent(tradingLevel: number): number {
  const level = Math.max(1, Math.min(tradingLevel, 6)) as keyof typeof MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL
  return MAX_NEGOTIATION_DISCOUNT_BY_TRADING_LEVEL[level]
}

export function getTradingGradeFromLevel(tradingLevel: number): string {
  const gradeIndex = Math.max(0, Math.min(tradingLevel - 1, TRADING_GRADES.length - 1))
  return TRADING_GRADES[gradeIndex] ?? 'F'
}

export function getSkillEffectChips(skill: CharacterSkill): SkillInfographicChip[] {
  if (skill.id === 'property_slots') return []

  if (skill.id === 'trading') {
    const stocksChip = skill.infographic.find((chip) => chip.id === 'stocks')

    return [
      stocksChip ?? {
        id: 'stocks',
        label: 'Доступные акции',
        value: getTradingGradeFromLevel(skill.level),
        tone: 'amber',
      },
      {
        id: 'sell-commission',
        label: 'Комиссия при продаже',
        value: `${calcSellCommissionPercent(skill.level)}%`,
        tone: 'emerald',
      },
    ]
  }

  return skill.infographic
}
