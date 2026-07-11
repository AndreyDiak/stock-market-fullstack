import type { StockListing } from '../../../../api/stocks';
import type { profit_grade } from '../../_model/types';

export type StockExchangeFilters = {
  query: string;
  sector: string | null;
  grade: profit_grade | null;
  onlyAvailable: boolean;
};

export const DEFAULT_STOCK_EXCHANGE_FILTERS: StockExchangeFilters = {
  query: '',
  sector: null,
  grade: null,
  onlyAvailable: false,
};

export type MarketListingGroups = {
  insider: StockListing[];
  ipoTrack: StockListing[];
  catalog: StockListing[];
};

export function splitMarketListings(listings: StockListing[]): MarketListingGroups {
  const insider: StockListing[] = [];
  const ipoTrack: StockListing[] = [];
  const catalog: StockListing[] = [];

  for (const listing of listings) {
    if (listing.hasInsiderPressure) {
      insider.push(listing);
      continue;
    }

    if (!listing.availableOnExchange) {
      ipoTrack.push(listing);
      continue;
    }

    catalog.push(listing);
  }

  return { insider, ipoTrack, catalog };
}

export function filterStockListings(
  listings: StockListing[],
  filters: StockExchangeFilters,
): StockListing[] {
  const query = filters.query.trim().toLowerCase();

  return listings.filter((listing) => {
    if (query) {
      const matchesQuery =
        listing.ticker.toLowerCase().includes(query) ||
        listing.name.toLowerCase().includes(query);
      if (!matchesQuery) return false;
    }

    if (filters.sector && listing.sector !== filters.sector) return false;
    if (filters.grade && listing.grade !== filters.grade) return false;
    if (filters.onlyAvailable && listing.isLocked) return false;

    return true;
  });
}

export function countActiveStockFilters(filters: StockExchangeFilters): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.sector) count += 1;
  if (filters.grade) count += 1;
  if (filters.onlyAvailable) count += 1;
  return count;
}

export function collectListingSectors(listings: StockListing[]): string[] {
  return [...new Set(listings.map((listing) => listing.sector))].sort((left, right) =>
    left.localeCompare(right),
  );
}
