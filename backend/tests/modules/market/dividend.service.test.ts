import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  DIVIDEND_CYCLE_TURNS,
  DividendService,
  calcProportionalDividend,
  rollDividendProfile,
} from '../../../src/modules/market/dividend.service.js';

function createMockPrisma() {
  const listings = [
    {
      id: 'listing-1',
      companyId: 'company-1',
      currentPrice: 100,
      paysDividends: true,
      dividendInterval: DIVIDEND_CYCLE_TURNS,
      dividendYieldPct: 4,
      turnsUntilDividend: 1,
      company: { ticker: 'ORCH', name: 'Orchard Systems' },
    },
  ];

  const holdings = [
    {
      id: 'holding-1',
      companyId: 'company-1',
      quantity: 10,
      turnsHeldInCycle: 4,
    },
  ];

  return {
    gameStockListing: {
      findMany: vi.fn(async () => listings),
      update: vi.fn(async () => listings[0]),
    },
    stock: {
      findMany: vi.fn(async () => holdings),
      update: vi.fn(async () => holdings[0]),
    },
    character: {
      update: vi.fn(async () => ({ id: 'char-1' })),
    },
  };
}

describe('dividend.service', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: DividendService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new DividendService(prisma as never);
  });

  it('rolls dividend profile with fixed 10-turn cycle', () => {
    const always = rollDividendProfile('C', () => 0);
    expect(always.paysDividends).toBe(true);
    expect(always.dividendInterval).toBe(DIVIDEND_CYCLE_TURNS);
    expect(always.turnsUntilDividend).toBe(DIVIDEND_CYCLE_TURNS);

    const never = rollDividendProfile('F', () => 0.99);
    expect(never.paysDividends).toBe(false);
  });

  it('scales payout by turnsHeldInCycle / 10', () => {
    const full = calcProportionalDividend(100, 10);
    expect(full).toBe(100);

    const partial = calcProportionalDividend(100, 3);
    expect(partial).toBe(30);
  });

  it('credits proportional balance and resets holding cycle on payout', async () => {
    const payouts = await service.processTurn('game-1', 5, 'char-1');

    expect(payouts).toHaveLength(1);
    expect(payouts[0]?.totalPaid).toBe(16);
    expect(prisma.character.update).toHaveBeenCalledWith({
      where: { id: 'char-1' },
      data: {
        balance: { increment: 16 },
        totalEarned: { increment: 16 },
      },
    });
    expect(prisma.stock.update).toHaveBeenCalledWith({
      where: { id: 'holding-1' },
      data: { turnsHeldInCycle: 0 },
    });
    expect(prisma.gameStockListing.update).toHaveBeenCalledWith({
      where: { id: 'listing-1' },
      data: {
        turnsUntilDividend: DIVIDEND_CYCLE_TURNS,
        dividendInterval: DIVIDEND_CYCLE_TURNS,
      },
    });
  });

  it('estimates next-turn proportional dividends for portfolio', async () => {
    const estimate = await service.estimateNextTurnDividends('game-1', 'char-1');

    expect(estimate).toEqual({
      label: 'Дивиденды по портфелю',
      amount: 16,
    });
  });
});
