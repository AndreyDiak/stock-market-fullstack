import { MarketSector, Profession } from '@prisma/client';

const PROFESSION_INSIDER_SECTOR: Partial<Record<Profession, MarketSector>> = {
  DOCTOR: MarketSector.HEALTHCARE,
  DEVELOPER: MarketSector.TECHNOLOGY,
  ENGINEER: MarketSector.ENERGY,
  FINANCIER: MarketSector.FINANCE,
  FARMER: MarketSector.AGRICULTURE,
};

export function getInsiderSectorForProfession(profession: Profession): MarketSector | null {
  return PROFESSION_INSIDER_SECTOR[profession] ?? null;
}

export function professionHasInsiderAccess(profession: Profession): boolean {
  return getInsiderSectorForProfession(profession) != null;
}
