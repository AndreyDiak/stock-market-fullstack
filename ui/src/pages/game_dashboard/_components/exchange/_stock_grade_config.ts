export const STOCK_GRADE_CONFIG: Record<
  'F' | 'E' | 'D' | 'C' | 'B' | 'A',
  { minBankingLevel: number; minReputation: number }
> = {
  F: { minBankingLevel: 1, minReputation: 0 },
  E: { minBankingLevel: 2, minReputation: 0 },
  D: { minBankingLevel: 3, minReputation: 0 },
  C: { minBankingLevel: 5, minReputation: 1 },
  B: { minBankingLevel: 7, minReputation: 3 },
  A: { minBankingLevel: 9, minReputation: 5 },
};

const SECTOR_LABELS: Record<string, string> = {
  TECHNOLOGY: 'Технологии',
  HEALTHCARE: 'Медицина',
  FINANCE: 'Финансы',
  AGRICULTURE: 'Агро',
  ENERGY: 'Энергетика',
};

export function formatSectorLabel(sector: string) {
  return SECTOR_LABELS[sector] ?? sector;
}
