import type { MarketSector } from '@prisma/client';

export const SECTOR_MOMENTUM_MIN = -1;
export const SECTOR_MOMENTUM_MAX = 1;

export type SectorTrend = 'rising' | 'falling' | 'neutral';

export function clampSectorMomentum(value: number): number {
  return Math.max(SECTOR_MOMENTUM_MIN, Math.min(SECTOR_MOMENTUM_MAX, value));
}

export function shiftSectorMomentum(current: number, delta: number): number {
  return clampSectorMomentum(current + delta);
}

export function decaySectorMomentum(value: number, duration: number): { value: number; duration: number } {
  if (duration <= 0) {
    return { value: driftTowardZero(value), duration: 0 };
  }
  return { value, duration: duration - 1 };
}

function driftTowardZero(value: number): number {
  const drift = 0.08;
  if (Math.abs(value) <= drift) return 0;
  return clampSectorMomentum(value - Math.sign(value) * drift);
}

export function getSectorTrend(value: number): SectorTrend {
  if (value >= 0.25) return 'rising';
  if (value <= -0.25) return 'falling';
  return 'neutral';
}

export function getSectorStatus(sector: MarketSector, value: number, duration: number) {
  return {
    sector,
    value,
    duration,
    trend: getSectorTrend(value),
  };
}
