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

/** Макс. скидка при торге по имуществу для уровня курса трейдинга (F→25% … A→50%). */
export function getMaxNegotiateDiscountPercent(tradingLevel: number): number {
  const level = Math.max(1, Math.min(tradingLevel, 6))
  return 20 + level * 5
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
        id: 'property-bargain',
        label: 'Доступный торг',
        value: `${getMaxNegotiateDiscountPercent(skill.level)}%`,
        tone: 'emerald',
      },
    ]
  }

  return skill.infographic
}
