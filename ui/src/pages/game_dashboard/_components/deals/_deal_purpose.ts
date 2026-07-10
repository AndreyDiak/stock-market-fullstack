import type { DealPurpose } from '../../../../api/gameTurn';

export const DEAL_PURPOSE_LABELS: Record<DealPurpose, string> = {
  VALUE_EXCHANGE: 'Обмен',
  LIQUIDITY: 'Ликвидность',
  DREAM_HELPER: 'К мечте',
};

export function formatDealPurposeLabel(purpose?: DealPurpose): string | null {
  if (!purpose) return null;
  return DEAL_PURPOSE_LABELS[purpose] ?? null;
}
