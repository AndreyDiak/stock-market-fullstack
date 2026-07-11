import type { MarketSector } from '@prisma/client';

export interface SectorImpactWeight {
  sector: MarketSector;
  weight: number;
}

export const SECTOR_SPILLOVER: Record<MarketSector, SectorImpactWeight[]> = {
  ENERGY: [
    { sector: 'FINANCE', weight: 0.45 },
    { sector: 'AGRICULTURE', weight: 0.3 },
  ],
  FINANCE: [
    { sector: 'TECHNOLOGY', weight: 0.35 },
    { sector: 'ENERGY', weight: 0.25 },
  ],
  TECHNOLOGY: [{ sector: 'FINANCE', weight: 0.3 }],
  HEALTHCARE: [{ sector: 'AGRICULTURE', weight: 0.25 }],
  AGRICULTURE: [
    { sector: 'ENERGY', weight: 0.2 },
    { sector: 'HEALTHCARE', weight: 0.15 },
  ],
};

export function buildAffectedSectors(
  primarySector: MarketSector,
  templateSecondary?: SectorImpactWeight[],
): SectorImpactWeight[] {
  const secondary = templateSecondary ?? SECTOR_SPILLOVER[primarySector];
  const merged = new Map<MarketSector, number>();

  merged.set(primarySector, 1);

  for (const entry of secondary) {
    const existing = merged.get(entry.sector) ?? 0;
    merged.set(entry.sector, Math.max(existing, entry.weight));
  }

  return [...merged.entries()].map(([sector, weight]) => ({ sector, weight }));
}
