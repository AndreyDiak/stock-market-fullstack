import type { ComponentType, SVGProps } from 'react';
import { IconBolt, IconCpu, IconHeart, IconLeaf, IconReportMoney } from '@tabler/icons-react';

type SectorIconProps = SVGProps<SVGSVGElement>;
type TablerSectorIcon = ComponentType<SectorIconProps>;

export const HealthcareSectorIcon = IconHeart;
export const TechnologySectorIcon = IconCpu;
export const FinanceSectorIcon = IconReportMoney;
export const AgricultureSectorIcon = IconLeaf;
export const EnergySectorIcon = IconBolt;

const SECTOR_ICON_MAP = {
  HEALTHCARE: HealthcareSectorIcon,
  TECHNOLOGY: TechnologySectorIcon,
  FINANCE: FinanceSectorIcon,
  AGRICULTURE: AgricultureSectorIcon,
  ENERGY: EnergySectorIcon,
} satisfies Record<string, TablerSectorIcon>;

export type MarketSectorKey = keyof typeof SECTOR_ICON_MAP;

export function getSectorIcon(sector: string) {
  return SECTOR_ICON_MAP[sector as MarketSectorKey] ?? TechnologySectorIcon;
}
