import { describe, it, expect } from 'vitest';
import {
  buildSkillUpgradePreview,
  calcQualificationBaseUpgradeCost,
  getQualificationUpgradeCost,
  getSkillUpgradeCost,
} from '../../src/modules/character_skills/_calculations.js';
import { getSkillDefinition } from '../../src/modules/character_skills/_definitions.js';
import { getMaxNegotiateDiscountPercent } from '../../src/modules/property_offers/_negotiate_discount.js';

describe('qualification upgrade cost', () => {
  const qualification = getSkillDefinition('qualification')!;

  it('uses profession-based base cost for level 2', () => {
    expect(getQualificationUpgradeCost({ baseSalary: 1600, currentLevel: 1 })).toBe(2500);
    expect(getQualificationUpgradeCost({ baseSalary: 2400, currentLevel: 1 })).toBe(2900);
    expect(getQualificationUpgradeCost({ baseSalary: 4000, currentLevel: 1 })).toBe(4800);
    expect(getQualificationUpgradeCost({ baseSalary: 9000, currentLevel: 1 })).toBe(10800);
    expect(getQualificationUpgradeCost({ baseSalary: 10500, currentLevel: 1 })).toBe(12600);
    expect(getQualificationUpgradeCost({ baseSalary: 12000, currentLevel: 1 })).toBe(14400);
  });

  it('scales upgrade cost by current level', () => {
    expect(getQualificationUpgradeCost({ baseSalary: 1600, currentLevel: 2 })).toBe(3400);
    expect(getQualificationUpgradeCost({ baseSalary: 2400, currentLevel: 3 })).toBe(4900);
    expect(getQualificationUpgradeCost({ baseSalary: 12000, currentLevel: 9 })).toBe(54700);
  });

  it('matches full upgrade table for street cleaner', () => {
    const baseSalary = 1600;
    const expected = [2500, 3400, 4300, 5100, 6000, 6900, 7800, 8600, 9500];
    for (let level = 1; level <= 9; level += 1) {
      expect(getQualificationUpgradeCost({ baseSalary, currentLevel: level })).toBe(expected[level - 1]);
    }
  });

  it('does not offer upgrade preview at max level', () => {
    expect(
      buildSkillUpgradePreview('qualification', qualification, 10, 1600),
    ).toBeNull();
  });

  it('resolves qualification base cost from salary', () => {
    expect(getSkillUpgradeCost('qualification', 1, 4000)).toBe(4800);
    expect(calcQualificationBaseUpgradeCost(1600)).toBe(2500);
  });
});

describe('banking upgrade cost', () => {
  const banking = getSkillDefinition('banking')!;

  it('uses linear pricing by target level', () => {
    expect(getSkillUpgradeCost('banking', 1, 0)).toBe(6000);
    expect(getSkillUpgradeCost('banking', 2, 0)).toBe(8400);
    expect(getSkillUpgradeCost('banking', 3, 0)).toBe(10800);
    expect(getSkillUpgradeCost('banking', 4, 0)).toBe(13200);
    expect(getSkillUpgradeCost('banking', 5, 0)).toBe(15600);
  });

  it('does not offer upgrade at max level', () => {
    expect(getSkillUpgradeCost('banking', 6, 0)).toBeNull();
    expect(buildSkillUpgradePreview('banking', banking, 6, 0)).toBeNull();
  });
});

describe('trading upgrade cost', () => {
  const trading = getSkillDefinition('trading')!;

  it('uses linear pricing by target level', () => {
    expect(getSkillUpgradeCost('trading', 1, 0)).toBe(7000);
    expect(getSkillUpgradeCost('trading', 2, 0)).toBe(10500);
    expect(getSkillUpgradeCost('trading', 3, 0)).toBe(14000);
    expect(getSkillUpgradeCost('trading', 4, 0)).toBe(17500);
    expect(getSkillUpgradeCost('trading', 5, 0)).toBe(21000);
  });

  it('does not offer upgrade at max level', () => {
    expect(getSkillUpgradeCost('trading', 6, 0)).toBeNull();
    expect(buildSkillUpgradePreview('trading', trading, 6, 0)).toBeNull();
  });
});

describe('property_slots upgrade cost', () => {
  const propertySlots = getSkillDefinition('property_slots')!;

  it('uses explicit price table', () => {
    expect(getSkillUpgradeCost('property_slots', 1, 0)).toBe(15000);
    expect(getSkillUpgradeCost('property_slots', 2, 0)).toBe(35000);
    expect(getSkillUpgradeCost('property_slots', 3, 0)).toBe(70000);
  });

  it('does not offer upgrade at max level', () => {
    expect(getSkillUpgradeCost('property_slots', 4, 0)).toBeNull();
    expect(buildSkillUpgradePreview('property_slots', propertySlots, 4, 0)).toBeNull();
  });
});

describe('max negotiation discount by trading level', () => {
  it('maps trading levels to discount caps', () => {
    expect(getMaxNegotiateDiscountPercent(1)).toBe(15);
    expect(getMaxNegotiateDiscountPercent(2)).toBe(25);
    expect(getMaxNegotiateDiscountPercent(3)).toBe(30);
    expect(getMaxNegotiateDiscountPercent(4)).toBe(35);
    expect(getMaxNegotiateDiscountPercent(5)).toBe(42);
    expect(getMaxNegotiateDiscountPercent(6)).toBe(50);
  });
});
