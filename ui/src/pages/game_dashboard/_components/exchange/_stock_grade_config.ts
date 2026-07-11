export const STOCK_GRADE_CONFIG: Record<
  'F' | 'E' | 'D' | 'C' | 'B' | 'A',
  { minTradingLevel: number; minReputation: number }
> = {
  F: { minTradingLevel: 1, minReputation: 0 },
  E: { minTradingLevel: 2, minReputation: 0 },
  D: { minTradingLevel: 3, minReputation: 0 },
  C: { minTradingLevel: 4, minReputation: 1 },
  B: { minTradingLevel: 5, minReputation: 3 },
  A: { minTradingLevel: 6, minReputation: 5 },
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
