import { formatMoney } from '../../../components/money/money_value'

export interface CharacterSkill {
  id: string
  name: string
  tag: string
  description: string
  effectLabel: string
  basePrice: number
  level: number
  maxLevel: number
}

export const CHARACTER_SKILLS: CharacterSkill[] = [
  {
    id: 'qualification',
    name: 'Повышение квалификации',
    tag: 'Работа',
    description: 'Курсы и аттестация по специальности. Растёт доход и внимание рынка к вашим контактам.',
    effectLabel: '+10% к зарплате и +2% к шансу инсайда за уровень',
    basePrice: 3500,
    level: 0,
    maxLevel: 10,
  },
  {
    id: 'banking',
    name: 'Курсы банковского дела',
    tag: 'Банк',
    description: 'Разбираетесь в кредитных продуктах и переговорах с банком.',
    effectLabel: '−2% к базовой ставке по кредитам за уровень (от 20%, мин. 10%)',
    basePrice: 4200,
    level: 0,
    maxLevel: 5,
  },
  {
    id: 'trading',
    name: 'Курс трейдинга',
    tag: 'Трейдинг',
    description: 'Практика на симуляторе и разбор сделок с наставником.',
    effectLabel: 'Грейды F → A: доступ к дорогим акциям и выше шанс успешной сделки',
    basePrice: 5000,
    level: 0,
    maxLevel: 5,
  },
  {
    id: 'property_slots',
    name: 'Слоты имущества',
    tag: 'Слоты',
    description: 'Оформление и учёт дополнительных объектов в инвентаре.',
    effectLabel: 'Разблокирует следующий слот имущества (макс. 4 активных)',
    basePrice: 15_000,
    level: 0,
    maxLevel: 3,
  },
]

/** @deprecated use CHARACTER_SKILLS */
export const CHARACTER_UPGRADES = CHARACTER_SKILLS

export type CharacterUpgrade = CharacterSkill

export const TRADING_GRADES = ['F', 'E', 'D', 'C', 'B', 'A'] as const

export function calcSkillPrice(skill: CharacterSkill) {
  return Math.round(skill.basePrice * (1 + skill.level * 0.35))
}

/** @deprecated use calcSkillPrice */
export const calcUpgradePrice = calcSkillPrice

export function calcEffectiveSalary(baseSalary: number, qualificationLevel: number) {
  return Math.round(baseSalary * (1 + 0.1 * qualificationLevel))
}

export function calcWorkLevel(qualificationLevel: number) {
  return qualificationLevel + 1
}

export function calcInsiderChance(qualificationLevel: number) {
  return Math.min(30, calcWorkLevel(qualificationLevel) * 2)
}

export function calcBankBaseRate(bankingLevel: number) {
  return Math.max(10, 20 - bankingLevel * 2)
}

export function getTradingGrade(tradingSkillLevel: number) {
  return TRADING_GRADES[Math.min(tradingSkillLevel, TRADING_GRADES.length - 1)]
}

export function getSkillLevel(skills: CharacterSkill[], skillId: string) {
  return skills.find((skill) => skill.id === skillId)?.level ?? 0
}

export function getSkillSegmentDisplay(
  skillId: string,
  level: number,
  maxLevel: number,
): { filled: number; total: number } {
  switch (skillId) {
    case 'property_slots':
      return { filled: 1 + level, total: 4 }
    case 'trading':
    case 'banking':
      return { filled: 1 + level, total: 6 }
    default:
      return { filled: level, total: maxLevel }
  }
}

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

export interface SkillUpgradePreview {
  skillName: string
  tag: string
  currentLevel: number
  nextLevel: number
  maxLevel: number
  price: number
  benefits: SkillUpgradeBenefit[]
}

export function buildSkillUpgradePreview(
  skill: CharacterSkill,
  context: { baseSalary: number },
): SkillUpgradePreview | null {
  if (skill.level >= skill.maxLevel) return null

  const nextLevel = skill.level + 1
  const price = calcSkillPrice(skill)
  const benefits: SkillUpgradeBenefit[] = []

  switch (skill.id) {
    case 'qualification': {
      const salaryNow = calcEffectiveSalary(context.baseSalary, skill.level)
      const salaryNext = calcEffectiveSalary(context.baseSalary, nextLevel)
      benefits.push({
        id: 'salary',
        kind: 'compare',
        label: 'Зарплата:',
        from: formatMoney(salaryNow),
        to: formatMoney(salaryNext),
        suffix: '₽/мес',
        toTone: 'emerald',
      })
      benefits.push({
        id: 'insider',
        kind: 'compare',
        label: 'Шанс инсайда:',
        from: `${calcInsiderChance(skill.level)}%`,
        to: `${calcInsiderChance(nextLevel)}%`,
        toTone: 'emerald',
      })
      benefits.push({
        id: 'career',
        kind: 'compare',
        label: 'Уровень работы:',
        from: String(calcWorkLevel(skill.level)),
        to: String(calcWorkLevel(nextLevel)),
        toTone: 'amber',
      })
      break
    }
    case 'banking': {
      const rateNow = calcBankBaseRate(skill.level)
      const rateNext = calcBankBaseRate(nextLevel)
      benefits.push({
        id: 'rate',
        kind: 'compare',
        label: 'Базовая ставка по кредитам:',
        from: `${rateNow}%`,
        to: `${rateNext}%`,
        toTone: 'emerald',
      })
      break
    }
    case 'trading': {
      const gradeNow = getTradingGrade(skill.level)
      const gradeNext = getTradingGrade(nextLevel)
      benefits.push({
        id: 'grade',
        kind: 'compare',
        label: 'Грейд трейдинга:',
        from: gradeNow,
        to: gradeNext,
        toTone: 'amber',
      })
      benefits.push({
        id: 'stocks',
        kind: 'text',
        label: '',
        text: 'Доступ к более дорогим акциям',
      })
      benefits.push({
        id: 'deals',
        kind: 'text',
        label: '',
        text: 'Выше шанс успешной сделки',
      })
      break
    }
    case 'property_slots': {
      const slotsNow = 1 + skill.level
      const slotsNext = 1 + nextLevel
      benefits.push({
        id: 'slots',
        kind: 'compare',
        label: 'Активных слотов имущества:',
        from: String(slotsNow),
        to: String(slotsNext),
        toTone: 'emerald',
      })
      benefits.push({
        id: 'unlock',
        kind: 'text',
        label: '',
        text: 'Следующий слот в инвентаре будет разблокирован',
      })
      break
    }
    default:
      benefits.push({
        id: 'effect',
        kind: 'text',
        label: '',
        text: skill.effectLabel,
      })
  }

  return {
    skillName: skill.name,
    tag: skill.tag,
    currentLevel: skill.level,
    nextLevel,
    maxLevel: skill.maxLevel,
    price,
    benefits,
  }
}
