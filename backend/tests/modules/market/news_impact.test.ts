import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewsImpactService } from '../../../src/modules/market/news_impact.service.js';

function createMockPrisma() {
  const listings = [
    { id: 'listing-tech', company: { sector: 'TECHNOLOGY' } },
    { id: 'listing-health', company: { sector: 'HEALTHCARE' } },
  ];

  return {
    gameStockListing: {
      findMany: vi.fn(async ({ where }: { where: { company?: { sector?: string } } }) => {
        if (where.company?.sector) {
          return listings.filter((listing) => listing.company.sector === where.company?.sector);
        }
        return listings;
      }),
      findUnique: vi.fn(async () => ({ id: 'listing-tech' })),
      findFirst: vi.fn(async () => ({ id: 'listing-tech' })),
    },
    newsPressure: {
      createMany: vi.fn(async () => ({ count: 1 })),
      create: vi.fn(async (args: { data: unknown }) => ({ id: 'pressure-1', ...args.data })),
    },
    marketSentiment: {
      findUnique: vi.fn(async () => ({ value: 0 })),
      upsert: vi.fn(async (args: { create: { value: number } }) => ({ value: args.create.value })),
    },
    sectorMomentum: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async (args: { create: { value: number } }) => ({ value: args.create.value })),
    },
  };
}

describe('news_impact.service', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: NewsImpactService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new NewsImpactService(prisma as never);
  });

  it('applies sector news to all listings in sector', async () => {
    await service.applyNews({
      id: 'news-1',
      gameId: 'game-1',
      kind: 'MARKET',
      impact: 0.8,
      sentiment: 'POSITIVE',
      sector: 'TECHNOLOGY',
    });

    expect(prisma.sectorMomentum.upsert).toHaveBeenCalled();
    expect(prisma.newsPressure.createMany).toHaveBeenCalled();
    const payload = prisma.newsPressure.createMany.mock.calls[0]?.[0];
    expect(payload?.data).toHaveLength(1);
  });

  it('applies company-specific news to one listing', async () => {
    await service.applyNews({
      id: 'news-2',
      gameId: 'game-1',
      kind: 'RUMOR',
      impact: 0.5,
      sentiment: 'NEGATIVE',
      companyId: 'company-1',
    });

    expect(prisma.newsPressure.createMany).toHaveBeenCalled();
  });

  it('shifts market sentiment for broad market news', async () => {
    await service.applyNews({
      id: 'news-3',
      gameId: 'game-1',
      kind: 'MARKET',
      impact: 0.9,
      sentiment: 'POSITIVE',
    });

    expect(prisma.marketSentiment.upsert).toHaveBeenCalled();
    expect(prisma.newsPressure.createMany).toHaveBeenCalled();
  });

  it('creates insider pressure with direction sign', async () => {
    const pressure = await service.createInsiderPressure({
      gameId: 'game-1',
      newsId: 'news-4',
      ticker: 'ORCH',
      direction: 'DOWN',
      movePercent: 12,
      remainingTurns: 4,
    });

    expect(pressure?.impact).toBeLessThan(0);
    expect(prisma.newsPressure.create).toHaveBeenCalled();
  });
});
