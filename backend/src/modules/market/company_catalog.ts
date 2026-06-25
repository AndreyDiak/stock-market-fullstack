import type { MarketSector, PrismaClient } from '@prisma/client';
import { COMPANIES } from '../../assets/companies.js';

function defaultPriceForTicker(ticker: string): number {
  let hash = 0;
  for (const char of ticker) {
    hash = (hash * 31 + char.charCodeAt(0)) % 10_000;
  }
  return 80 + (hash % 920);
}

/** Гарантирует наличие компании в БД по тикеру из каталога. */
export async function ensureCompanyByTicker(prisma: PrismaClient, ticker: string) {
  const catalog = COMPANIES.find((c) => c.ticker === ticker);
  if (!catalog) {
    throw new Error(`Unknown ticker: ${ticker}`);
  }

  return prisma.company.upsert({
    where: { ticker },
    create: {
      ticker: catalog.ticker,
      name: catalog.name,
      sector: catalog.sector as MarketSector,
      description: catalog.description,
      currentPrice: defaultPriceForTicker(ticker),
    },
    update: {},
  });
}

export { defaultPriceForTicker };
