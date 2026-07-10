import { describe, it, expect } from 'vitest';
import { Profession } from '@prisma/client';
import { PROFESSION_DREAMS } from '../../src/assets/dreams.js';
import { buildCharacterDreamPreview } from '../../src/modules/characters/dream_preview.js';

describe('buildCharacterDreamPreview', () => {
  it('builds 4-stage preview for street cleaner with car wash finale', () => {
    const dream = PROFESSION_DREAMS[Profession.STREET_CLEANER]!;
    const preview = buildCharacterDreamPreview(Profession.STREET_CLEANER, dream);

    expect(preview.stageCount).toBe(4);
    expect(preview.stages).toHaveLength(4);
    expect(preview.stages[3]?.isFinal).toBe(true);

    const finalLabels = preview.stages[3]?.requirementsPreview.map((item) => item.label) ?? [];
    expect(finalLabels.some((label) => label.includes('Автомойка'))).toBe(true);
  });

  it('builds 4-stage preview for farmer with tractor mid-path and combine finale', () => {
    const dream = PROFESSION_DREAMS[Profession.FARMER]!;
    const preview = buildCharacterDreamPreview(Profession.FARMER, dream);

    expect(preview.stageCount).toBe(4);
    expect(preview.stages[1]?.requirementsPreview.map((item) => item.label)).toEqual(
      expect.arrayContaining(['Трактор']),
    );

    const finalLabels = preview.stages[3]?.requirementsPreview.map((item) => item.label) ?? [];
    expect(finalLabels.some((label) => label.includes('Комбайн'))).toBe(true);
    expect(finalLabels.some((label) => label.includes('Склад'))).toBe(true);
  });

  it('builds developer finale with world trip', () => {
    const dream = PROFESSION_DREAMS[Profession.DEVELOPER]!;
    const preview = buildCharacterDreamPreview(Profession.DEVELOPER, dream);

    expect(preview.stageCount).toBe(5);
    const finalLabels = preview.stages[4]?.requirementsPreview.map((item) => item.label) ?? [];
    expect(finalLabels.some((label) => label.includes('Кругосветка'))).toBe(true);
  });

  it('builds financier finale with yacht and painting', () => {
    const dream = PROFESSION_DREAMS[Profession.FINANCIER]!;
    const preview = buildCharacterDreamPreview(Profession.FINANCIER, dream);

    const finalLabels = preview.stages[4]?.requirementsPreview.map((item) => item.label) ?? [];
    expect(finalLabels.some((label) => label.includes('Яхта'))).toBe(true);
    expect(finalLabels.some((label) => label.includes('Картина'))).toBe(true);
  });

  it('uses dynamic stage count per profession', () => {
    expect(PROFESSION_DREAMS[Profession.STREET_CLEANER]?.stages).toHaveLength(4);
    expect(PROFESSION_DREAMS[Profession.FARMER]?.stages).toHaveLength(4);
    expect(PROFESSION_DREAMS[Profession.ENGINEER]?.stages).toHaveLength(5);
    expect(PROFESSION_DREAMS[Profession.DEVELOPER]?.stages).toHaveLength(5);
    expect(PROFESSION_DREAMS[Profession.FINANCIER]?.stages).toHaveLength(5);
    expect(PROFESSION_DREAMS[Profession.DOCTOR]?.stages).toHaveLength(5);
  });
});
