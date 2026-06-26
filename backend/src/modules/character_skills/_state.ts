import type { Character } from '@prisma/client';
import {
  buildCharacterStats,
  buildSkillCurrentInfographic,
  buildSkillUpgradePreview,
  calcSkillPrice,
  getSkillLevelFromCharacter,
  getSkillLevelTooltip,
  getSkillSegmentDisplay,
  type SkillInfographicChip,
  type SkillLevelTooltip,
  type SkillUpgradePreview,
} from './_calculations.js';
import { SKILL_DEFINITIONS } from './_definitions.js';

export interface CharacterSkillDto {
  id: string;
  name: string;
  tag: string;
  description: string;
  effectLabel: string;
  level: number;
  maxLevel: number;
  upgradePrice: number | null;
  canUpgrade: boolean;
  infographic: SkillInfographicChip[];
  upgradePreview: SkillUpgradePreview | null;
  segmentDisplay: { filled: number; total: number };
  levelTooltips: SkillLevelTooltip[];
}

export interface CharacterSkillsState {
  skills: CharacterSkillDto[];
  stats: ReturnType<typeof buildCharacterStats>;
}

function buildLevelTooltips(
  skillId: string,
  level: number,
  maxLevel: number,
  baseSalary: number,
): SkillLevelTooltip[] {
  switch (skillId) {
    case 'trading':
    case 'banking':
      return Array.from({ length: 6 }, (_, index) =>
        getSkillLevelTooltip(skillId, index, baseSalary),
      );
    case 'property_slots':
      return [1, 2, 3, 4].map((slotNumber) =>
        getSkillLevelTooltip(skillId, slotNumber, baseSalary),
      );
    case 'qualification':
      return Array.from({ length: maxLevel }, (_, index) =>
        getSkillLevelTooltip(skillId, index + 1, baseSalary),
      );
    default:
      return Array.from({ length: maxLevel }, (_, index) =>
        getSkillLevelTooltip(skillId, index, baseSalary),
      );
  }
}

function canUpgradeSkill(
  skillId: string,
  level: number,
  maxLevel: number,
  balance: number,
  propertySlotLevel: number,
) {
  if (level >= maxLevel) return false;

  const price = calcSkillPrice(
    skillId,
    level,
    SKILL_DEFINITIONS.find((skill) => skill.id === skillId)?.basePrice ?? 0,
  );
  if (balance < price) return false;

  if (skillId === 'property_slots' && propertySlotLevel >= 4) {
    return false;
  }

  return true;
}

export function buildCharacterSkillsState(character: Character): CharacterSkillsState {
  const stats = buildCharacterStats(character);

  const skills = SKILL_DEFINITIONS.map((definition) => {
    const level = getSkillLevelFromCharacter(character, definition.id);
    const upgradePrice =
      level >= definition.maxLevel
        ? null
        : calcSkillPrice(definition.id, level, definition.basePrice);
    const upgradePreview = buildSkillUpgradePreview(
      definition.id,
      definition,
      level,
      character.salary,
    );

    return {
      id: definition.id,
      name: definition.name,
      tag: definition.tag,
      description: definition.description,
      effectLabel: definition.effectLabel,
      level,
      maxLevel: definition.maxLevel,
      upgradePrice,
      canUpgrade: canUpgradeSkill(
        definition.id,
        level,
        definition.maxLevel,
        character.balance,
        character.propertySlotLevel,
      ),
      infographic: buildSkillCurrentInfographic(definition.id, level, character.salary),
      upgradePreview,
      segmentDisplay: getSkillSegmentDisplay(definition.id, level, definition.maxLevel),
      levelTooltips: buildLevelTooltips(
        definition.id,
        level,
        definition.maxLevel,
        character.salary,
      ),
    };
  });

  return { skills, stats };
}

export function getSkillLevelUpdateData(skillId: string, currentLevel: number) {
  const nextLevel = currentLevel + 1;

  switch (skillId) {
    case 'qualification':
      return { professionLevel: nextLevel };
    case 'banking':
      return { bankingLevel: nextLevel };
    case 'trading':
      return { tradingLevel: nextLevel };
    case 'property_slots':
      return { propertySlotLevel: nextLevel };
    default:
      return null;
  }
}
