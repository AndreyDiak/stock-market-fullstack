import type { MarketSector, StockGrade } from '@prisma/client';
import { STOCK_GRADE_CONFIG } from '../../assets/stock_grade.js';

export type StockArchetype = 'growth' | 'dividend' | 'speculative' | 'defensive';

export function resolveStockArchetype(input: {
  sector: MarketSector;
  grade: StockGrade;
  paysDividends: boolean;
}): StockArchetype | null {
  if (input.paysDividends) return 'dividend';

  const config = STOCK_GRADE_CONFIG[input.grade];
  if (input.grade === 'F' || input.grade === 'E') return 'speculative';

  if (input.sector === 'HEALTHCARE' && ['C', 'B', 'A'].includes(input.grade)) {
    return 'defensive';
  }

  if (
    input.sector === 'TECHNOLOGY' &&
    ['D', 'C', 'B'].includes(input.grade) &&
    config.newsReactivity >= 1.1
  ) {
    return 'growth';
  }

  return null;
}

export const STOCK_ARCHETYPE_LABELS: Record<StockArchetype, string> = {
  growth: 'Рост',
  dividend: 'Дивидендная',
  speculative: 'Волатильная',
  defensive: 'Стабильная',
};
