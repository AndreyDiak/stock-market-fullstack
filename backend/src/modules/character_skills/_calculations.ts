import type { Character } from '@prisma/client';
import { getMaxNegotiateDiscountPercent } from '../property_offers/_negotiate_discount.js';
import { calcSellCommissionPercent } from '../market/sell_commission.js';
import { TRADING_GRADES } from './_definitions.js';

export function getSkillUpgradeTier(_skillId: string, level: number) {
  return Math.max(0, level - 1);
}

export function calcSkillPrice(skillId: string, level: number, basePrice: number) {
  return Math.round(basePrice * (1 + getSkillUpgradeTier(skillId, level) * 0.35));
}

export function calcEffectiveSalary(baseSalary: number, qualificationLevel: number) {
  return Math.round(baseSalary * (1 + 0.1 * Math.max(0, qualificationLevel - 1)));
}

export function calcSalaryBonus(baseSalary: number, qualificationLevel: number) {
  return calcEffectiveSalary(baseSalary, qualificationLevel) - baseSalary;
}

export function calcWorkLevel(qualificationLevel: number) {
  return Math.max(1, qualificationLevel);
}

export function calcInsiderChance(qualificationLevel: number) {
  return Math.min(30, calcWorkLevel(qualificationLevel) * 2);
}

export function calcBankBaseRate(bankingLevel: number) {
  return Math.max(10, 20 - Math.max(0, bankingLevel - 1) * 2);
}

export function getTradingGrade(tradingLevel: number) {
  const gradeIndex = Math.max(0, Math.min(tradingLevel - 1, TRADING_GRADES.length - 1));
  return TRADING_GRADES[gradeIndex];
}

export function getAccessiblePropertyGrades(bankingLevel: number): string {
  const count = Math.max(1, Math.min(bankingLevel, TRADING_GRADES.length));
  return TRADING_GRADES.slice(0, count).join(', ');
}

export function countUnlockedPropertySlots(propertySlotLevel: number) {
  return Math.min(4, Math.max(1, propertySlotLevel));
}

export function getSkillLevelFromCharacter(character: Character, skillId: string) {
  switch (skillId) {
    case 'qualification':
      return character.professionLevel;
    case 'banking':
      return character.bankingLevel;
    case 'trading':
      return character.tradingLevel;
    case 'property_slots':
      return character.propertySlotLevel;
    default:
      return 1;
  }
}

export function getSkillSegmentDisplay(skillId: string, level: number, maxLevel: number) {
  switch (skillId) {
    case 'property_slots':
      return { filled: level, total: 4 };
    case 'trading':
    case 'banking':
      return { filled: level, total: 6 };
    default:
      return { filled: level, total: maxLevel };
  }
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount);
}

export interface SkillUpgradeBenefit {
  id: string;
  kind: 'compare' | 'text' | 'bonus';
  label: string;
  from?: string;
  to?: string;
  suffix?: string;
  fromTone?: 'muted' | 'emerald' | 'amber';
  toTone?: 'emerald' | 'amber';
  text?: string;
  highlight?: string;
}

export interface SkillInfographicChip {
  id: string;
  label: string;
  value?: string;
  moneyAmount?: number;
  tone?: 'emerald' | 'amber';
}

export interface SkillLevelTooltip {
  title: string;
  lines: string[];
}

export interface SkillUpgradePreview {
  skillName: string;
  tag: string;
  currentLevel: number;
  nextLevel: number;
  maxLevel: number;
  price: number;
  benefits: SkillUpgradeBenefit[];
}

export function buildSkillUpgradePreview(
  skillId: string,
  definition: { name: string; tag: string; maxLevel: number; basePrice: number },
  level: number,
  baseSalary: number,
): SkillUpgradePreview | null {
  if (level >= definition.maxLevel) return null;

  const nextLevel = level + 1;
  const price = calcSkillPrice(skillId, level, definition.basePrice);
  const benefits: SkillUpgradeBenefit[] = [];

  switch (skillId) {
    case 'qualification': {
      const salaryNow = calcEffectiveSalary(baseSalary, level);
      const salaryNext = calcEffectiveSalary(baseSalary, nextLevel);
      benefits.push({
        id: 'salary',
        kind: 'compare',
        label: 'Зарплата:',
        from: formatMoney(salaryNow),
        to: formatMoney(salaryNext),
        suffix: '₽/мес',
        toTone: 'emerald',
      });
      benefits.push({
        id: 'insider',
        kind: 'compare',
        label: 'Шанс инсайда:',
        from: `${calcInsiderChance(level)}%`,
        to: `${calcInsiderChance(nextLevel)}%`,
        toTone: 'emerald',
      });
      benefits.push({
        id: 'career',
        kind: 'compare',
        label: 'Уровень работы:',
        from: String(calcWorkLevel(level)),
        to: String(calcWorkLevel(nextLevel)),
        toTone: 'amber',
      });
      break;
    }
    case 'banking': {
      benefits.push({
        id: 'rate',
        kind: 'compare',
        label: 'Базовая ставка по кредитам:',
        from: `${calcBankBaseRate(level)}%`,
        to: `${calcBankBaseRate(nextLevel)}%`,
        toTone: 'emerald',
      });
      benefits.push({
        id: 'property-deals',
        kind: 'compare',
        label: 'Сделки с имуществом:',
        from: getAccessiblePropertyGrades(level),
        to: getAccessiblePropertyGrades(nextLevel),
        toTone: 'amber',
      });
      break;
    }
    case 'trading': {
      benefits.push({
        id: 'grade',
        kind: 'compare',
        label: 'Грейд трейдинга:',
        from: getTradingGrade(level),
        to: getTradingGrade(nextLevel),
        toTone: 'amber',
      });
      benefits.push({
        id: 'property-bargain',
        kind: 'compare',
        label: 'Торг',
        from: `${getMaxNegotiateDiscountPercent(level)}%`,
        to: `${getMaxNegotiateDiscountPercent(nextLevel)}%`,
        toTone: 'emerald',
      });
      benefits.push({
        id: 'stocks',
        kind: 'text',
        label: '',
        text: 'Доступ к более дорогим акциям',
      });
      break;
    }
    case 'property_slots': {
      benefits.push({
        id: 'slots',
        kind: 'compare',
        label: 'Активных слотов имущества:',
        from: String(countUnlockedPropertySlots(level)),
        to: String(countUnlockedPropertySlots(nextLevel)),
        toTone: 'emerald',
      });
      benefits.push({
        id: 'unlock',
        kind: 'text',
        label: '',
        text: 'Следующий слот в инвентаре будет разблокирован',
      });
      break;
    }
    default:
      break;
  }

  return {
    skillName: definition.name,
    tag: definition.tag,
    currentLevel: level,
    nextLevel,
    maxLevel: definition.maxLevel,
    price,
    benefits,
  };
}

export function buildSkillCurrentInfographic(
  skillId: string,
  level: number,
  baseSalary: number,
): SkillInfographicChip[] {
  switch (skillId) {
    case 'qualification': {
      const bonus = calcSalaryBonus(baseSalary, level);
      return [
        {
          id: 'salary-bonus',
          label: 'Зарплатный бонус',
          moneyAmount: bonus,
          tone: bonus > 0 ? 'emerald' : undefined,
        },
        {
          id: 'insider',
          label: 'Шанс на инсайд',
          value: `${calcInsiderChance(level)}%`,
          tone: 'emerald',
        },
      ];
    }
    case 'banking':
      return [
        {
          id: 'rate',
          label: 'Ставка по кредиту',
          value: `${calcBankBaseRate(level)}%`,
          tone: 'emerald',
        },
        {
          id: 'property-deals',
          label: 'Сделки с имуществом',
          value: getAccessiblePropertyGrades(level),
          tone: 'amber',
        },
      ];
    case 'trading':
      return [
        {
          id: 'stocks',
          label: 'Доступные акции',
          value: getTradingGrade(level),
          tone: 'amber',
        },
        {
          id: 'sell-commission',
          label: 'Комиссия при продаже',
          value: `${calcSellCommissionPercent(level)}%`,
          tone: 'emerald',
        },
      ];
    default:
      return [];
  }
}

export function getSkillLevelTooltip(
  skillId: string,
  levelAtCell: number,
  baseSalary: number,
): SkillLevelTooltip {
  switch (skillId) {
    case 'banking': {
      const grade = TRADING_GRADES[Math.min(levelAtCell, TRADING_GRADES.length - 1)] ?? 'F';
      const bankingLevel = levelAtCell + 1;
      return {
        title: `Грейд ${grade}`,
        lines: [
          `Ставка по кредиту: ${calcBankBaseRate(bankingLevel)}%`,
          `Сделки с имуществом: ${getAccessiblePropertyGrades(bankingLevel)}`,
        ],
      };
    }
    case 'trading': {
      const tradingLevel = levelAtCell + 1;
      const grade = getTradingGrade(tradingLevel);
      return {
        title: `Грейд ${grade}`,
        lines: [
          `Комиссия при продаже акций: ${calcSellCommissionPercent(tradingLevel)}%`,
          `Макс. скидка при торге по имуществу: ${getMaxNegotiateDiscountPercent(tradingLevel)}%`,
        ],
      };
    }
    case 'qualification': {
      const bonus = calcSalaryBonus(baseSalary, levelAtCell);
      return {
        title: `Уровень ${levelAtCell}`,
        lines: [
          `Зарплатный бонус: +${formatMoney(bonus)} ₽`,
          `Шанс на инсайд: ${calcInsiderChance(levelAtCell)}%`,
        ],
      };
    }
    case 'property_slots': {
      if (levelAtCell <= 1) {
        return {
          title: 'Слот 1',
          lines: ['Базовый слот имущества'],
        };
      }

      return {
        title: `Слот ${levelAtCell}`,
        lines: [
          `Активных слотов: ${levelAtCell}`,
          `Требуется ${levelAtCell - 1} улучшение навыка`,
        ],
      };
    }
    default:
      return { title: '', lines: [] };
  }
}

export function buildCharacterStats(character: Character) {
  const qualificationLevel = character.professionLevel;
  const bankingLevel = character.bankingLevel;
  const tradingLevel = character.tradingLevel;
  const propertySlotLevel = character.propertySlotLevel;

  return {
    effectiveSalary: calcEffectiveSalary(character.salary, qualificationLevel),
    workLevel: calcWorkLevel(qualificationLevel),
    insiderChancePercent: calcInsiderChance(qualificationLevel),
    bankBaseRatePercent: calcBankBaseRate(bankingLevel),
    tradingGrade: getTradingGrade(tradingLevel),
    sellCommissionPercent: calcSellCommissionPercent(tradingLevel),
    propertySlotsUnlocked: countUnlockedPropertySlots(propertySlotLevel),
    salaryBonus: calcSalaryBonus(character.salary, qualificationLevel),
    qualificationBonusPercent: Math.max(0, qualificationLevel - 1) * 10,
  };
}
