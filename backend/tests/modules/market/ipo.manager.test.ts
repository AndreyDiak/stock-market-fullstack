import { describe, expect, it, vi, beforeEach } from 'vitest';
import { IPOManager } from '../../../src/modules/market/ipo.manager.js';

function createMockPrisma() {
  return {
    iPO: {
      findFirst: vi.fn(async () => null),
      count: vi.fn(async () => 0),
      create: vi.fn(async (args: { data: Record<string, unknown> }) => ({
        id: 'ipo-1',
        ...args.data,
        company: { ticker: 'ORCH', name: 'Orchard Systems' },
      })),
      findUniqueOrThrow: vi.fn(),
    },
    gameStockListing: {
      findMany: vi.fn(async () => [
        {
          companyId: 'company-1',
          company: { ticker: 'ORCH', name: 'Orchard Systems' },
        },
      ]),
    },
    company: {
      findUniqueOrThrow: vi.fn(async () => ({ id: 'company-1', ticker: 'ORCH', name: 'Orchard Systems' })),
    },
    news: {
      create: vi.fn(),
    },
  };
}

describe('ipo.manager', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let manager: IPOManager;

  beforeEach(() => {
    prisma = createMockPrisma();
    manager = new IPOManager(prisma as never);
  });

  it('rejects subscription outside allowed range', async () => {
    prisma.iPO.findFirst = vi.fn(async () => ({
      id: 'ipo-1',
      gameId: 'game-1',
      isCompleted: false,
      minSubscription: 10,
      maxSubscription: 100,
      ipoPrice: 50,
      targetGrade: 'C',
    }));

    await expect(
      manager.subscribeToIPO('game-1', 'ipo-1', {
        id: 'player-1',
        balance: 10_000,
        bankingLevel: 5,
        reputation: 3,
      }, 5),
    ).rejects.toThrow();
  });
});
