import type { PriceDirection, Sentiment } from '@prisma/client';
import type { CompanyData } from '../../assets/companies.js';
import type { StaticNewsTemplate } from '../../assets/news.js';
import type { PersistedNewsItem } from './types.js';

export function excerptFromBody(body: string, max = 120) {
  const normalized = body.replace(/\s+/g, ' ').trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 1)}…`;
}

type NewsRow = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  sentiment: Sentiment;
  impact: number;
  sector: PersistedNewsItem['sector'];
  companyId: string | null;
  publishedAt: Date;
  company?: { ticker: string } | null;
  payload?: unknown;
};

export function toPersistedNewsItem(
  row: NewsRow,
  overrides?: Partial<Pick<PersistedNewsItem, 'kind' | 'hot' | 'ticker' | 'payload'>>,
): PersistedNewsItem {
  const kind = (overrides?.kind ?? row.kind) as PersistedNewsItem['kind'];

  const payload = overrides?.payload ?? row.payload ?? undefined;
  const publishedStep =
    typeof (payload as { publishedStep?: number } | undefined)?.publishedStep === 'number'
      ? (payload as { publishedStep: number }).publishedStep
      : undefined;

  return {
    id: row.id,
    kind,
    title: row.title,
    body: row.body ?? '',
    excerpt: excerptFromBody(row.body ?? ''),
    sentiment: row.sentiment,
    impact: row.impact,
    sector: row.sector,
    companyId: row.companyId,
    ticker: overrides?.ticker ?? row.company?.ticker ?? undefined,
    hot: overrides?.hot ?? kind === 'INSIDER',
    publishedAt: row.publishedAt.toISOString(),
    publishedStep,
    payload,
  };
}

export function templatePayload(template: StaticNewsTemplate) {
  return {
    templateId: template.id,
    sentimentScore: template.sentimentScore,
  };
}

const INTERNAL_PAYLOAD_KEYS = new Set([
  'affectedSectors',
  'primarySector',
  'marketImpact',
  'sentimentScore',
  'templateId',
]);

export function sanitizeNewsPayloadForClient(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const record = payload as Record<string, unknown>;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (!INTERNAL_PAYLOAD_KEYS.has(key)) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export function sanitizePersistedNewsItem(item: PersistedNewsItem): PersistedNewsItem {
  return {
    ...item,
    payload: sanitizeNewsPayloadForClient(item.payload),
  };
}

export function insiderDirection(expectedMovePercent: number): PriceDirection {
  return expectedMovePercent < 0 ? 'DOWN' : 'UP';
}

export function insiderMovePercent(expectedMovePercent: number) {
  return Math.max(3, Math.min(25, Math.round(Math.abs(expectedMovePercent) || 8)));
}

export function formatInsiderLead(
  company: CompanyData,
  turnsUntilImpact: number,
  direction: PriceDirection,
  movePercent: number,
) {
  const movement =
    direction === 'UP'
      ? `выровут примерно на ${movePercent}%`
      : `упадут примерно на ${movePercent}%`;

  return `Инсайд: через ${turnsUntilImpact} ход(ов) акции ${company.name} (${company.ticker}) ${movement}.`;
}

export function resolveInsiderParams(
  template: StaticNewsTemplate,
  gameId: string,
  gameStep: number,
  pickTurnsUntilImpact: (gameId: string, gameStep: number, salt: string) => number,
) {
  const expectedMovePercent =
    template.expectedMovePercent ?? (Math.random() > 0.5 ? 9 : -8);
  const turnsUntilImpact =
    template.turnsUntilImpact ??
    pickTurnsUntilImpact(gameId, gameStep, 'insider-turns');
  const direction = insiderDirection(expectedMovePercent);
  const movePercent = insiderMovePercent(expectedMovePercent);

  return { expectedMovePercent, turnsUntilImpact, direction, movePercent };
}
