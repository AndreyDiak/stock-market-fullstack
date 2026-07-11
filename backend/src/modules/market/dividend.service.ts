import type { PrismaClient } from '@prisma/client';
import type { StockGrade } from '../../assets/stock_grade.js';
import { STOCK_GRADE_CONFIG } from '../../assets/stock_grade.js';

export const DIVIDEND_CYCLE_TURNS = 10;

export interface DividendPayoutEvent {
  listingId: string;
  ticker: string;
  companyName: string;
  totalPaid: number;
}

export function rollDividendProfile(
  grade: StockGrade,
  rng: () => number,
): {
  paysDividends: boolean;
  dividendInterval: number | null;
  dividendYieldPct: number | null;
  turnsUntilDividend: number | null;
} {
  const config = STOCK_GRADE_CONFIG[grade];

  if (rng() >= config.dividendChance) {
    return {
      paysDividends: false,
      dividendInterval: null,
      dividendYieldPct: null,
      turnsUntilDividend: null,
    };
  }

  const [yieldMin, yieldMax] = config.dividendYield;
  const dividendYieldPct = Number((yieldMin + rng() * (yieldMax - yieldMin)).toFixed(2));

  return {
    paysDividends: true,
    dividendInterval: DIVIDEND_CYCLE_TURNS,
    dividendYieldPct,
    turnsUntilDividend: DIVIDEND_CYCLE_TURNS,
  };
}

export function calcDividendPerShare(
  currentPrice: number,
  dividendYieldPct: number | null | undefined,
): number | null {
  if (dividendYieldPct == null || dividendYieldPct <= 0) return null;
  return Number((currentPrice * (dividendYieldPct / 100)).toFixed(2));
}

export function calcProportionalDividend(
  fullPayout: number,
  turnsHeldInCycle: number,
): number {
  const held = Math.max(0, Math.min(turnsHeldInCycle, DIVIDEND_CYCLE_TURNS));
  return Number((fullPayout * (held / DIVIDEND_CYCLE_TURNS)).toFixed(2));
}

export class DividendService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async incrementHoldingCycles(gameId: string, characterId: string): Promise<void> {
    const holdings = await this.#prisma.stock.findMany({
      where: { gameId, ownerId: characterId, quantity: { gt: 0 } },
    });

    for (const holding of holdings) {
      const nextHeld = Math.min(DIVIDEND_CYCLE_TURNS, holding.turnsHeldInCycle + 1);
      if (nextHeld === holding.turnsHeldInCycle) continue;

      await this.#prisma.stock.update({
        where: { id: holding.id },
        data: { turnsHeldInCycle: nextHeld },
      });
    }
  }

  async processTurn(
    gameId: string,
    _turn: number,
    characterId: string,
  ): Promise<DividendPayoutEvent[]> {
    await this.incrementHoldingCycles(gameId, characterId);

    const listings = await this.#prisma.gameStockListing.findMany({
      where: { gameId, paysDividends: true },
      include: { company: true },
    });

    if (listings.length === 0) return [];

    const payouts: DividendPayoutEvent[] = [];
    let totalBalanceCredit = 0;

    for (const listing of listings) {
      if (listing.turnsUntilDividend == null) continue;

      const nextTurns = listing.turnsUntilDividend - 1;

      if (nextTurns > 0) {
        await this.#prisma.gameStockListing.update({
          where: { id: listing.id },
          data: { turnsUntilDividend: nextTurns },
        });
        continue;
      }

      const holdings = await this.#prisma.stock.findMany({
        where: { gameId, companyId: listing.companyId, ownerId: characterId },
      });

      const yieldPct = listing.dividendYieldPct ?? 0;
      const payoutPerShare = listing.currentPrice * (yieldPct / 100);
      let totalPaid = 0;

      for (const holding of holdings) {
        const fullPayout = holding.quantity * payoutPerShare;
        const proportional = calcProportionalDividend(fullPayout, holding.turnsHeldInCycle);
        totalPaid += proportional;

        await this.#prisma.stock.update({
          where: { id: holding.id },
          data: { turnsHeldInCycle: 0 },
        });
      }

      totalPaid = Number(totalPaid.toFixed(2));

      await this.#prisma.gameStockListing.update({
        where: { id: listing.id },
        data: {
          turnsUntilDividend: DIVIDEND_CYCLE_TURNS,
          dividendInterval: DIVIDEND_CYCLE_TURNS,
        },
      });

      if (totalPaid > 0) {
        totalBalanceCredit += totalPaid;
        payouts.push({
          listingId: listing.id,
          ticker: listing.company.ticker,
          companyName: listing.company.name,
          totalPaid,
        });
      }
    }

    if (totalBalanceCredit > 0) {
      await this.#prisma.character.update({
        where: { id: characterId },
        data: {
          balance: { increment: totalBalanceCredit },
          totalEarned: { increment: totalBalanceCredit },
        },
      });
    }

    return payouts;
  }

  async estimateNextTurnDividends(
    gameId: string,
    characterId: string,
  ): Promise<{ label: string; amount: number } | null> {
    const listings = await this.#prisma.gameStockListing.findMany({
      where: { gameId, paysDividends: true, turnsUntilDividend: 1 },
      include: { company: true },
    });

    if (listings.length === 0) return null;

    const holdings = await this.#prisma.stock.findMany({
      where: { ownerId: characterId, gameId },
    });
    const holdingByCompany = new Map(
      holdings.map((holding) => [holding.companyId, holding]),
    );

    let amount = 0;
    for (const listing of listings) {
      const holding = holdingByCompany.get(listing.companyId);
      if (!holding || holding.quantity <= 0 || listing.dividendYieldPct == null) continue;

      const fullPayout = holding.quantity * listing.currentPrice * (listing.dividendYieldPct / 100);
      amount += calcProportionalDividend(fullPayout, holding.turnsHeldInCycle);
    }

    if (amount <= 0) return null;

    return {
      label: 'Дивиденды по портфелю',
      amount: Number(amount.toFixed(2)),
    };
  }
}
