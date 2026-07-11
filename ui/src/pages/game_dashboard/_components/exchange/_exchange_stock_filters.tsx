import { gameAudio } from '../../../../lib/audio/game_audio';
import { formatSectorLabel } from './_stock_grade_config';
import { getSectorIcon } from './_sector_icons';
import type { StockExchangeFilters } from './_exchange_filter_utils';

const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38bdf8',
  HEALTHCARE: '#fb7185',
  FINANCE: '#fbbf24',
  AGRICULTURE: '#34d399',
  ENERGY: '#a78bfa',
};

function SectorChip({
  active,
  label,
  sector,
  onClick,
}: {
  active: boolean;
  label: string;
  sector?: string;
  onClick: () => void;
}) {
  const Icon = sector ? getSectorIcon(sector) : null;
  const color = sector ? (SECTOR_COLORS[sector] ?? '#94a3b8') : undefined;

  return (
    <button
      type="button"
      className={`exchange-filters__chip${active ? ' exchange-filters__chip--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
      style={
        active && color
          ? {
              borderColor: `${color}66`,
              backgroundColor: `${color}22`,
              color,
            }
          : undefined
      }
    >
      {Icon ? <Icon className="exchange-filters__chip-icon" aria-hidden /> : null}
      <span>{label}</span>
    </button>
  );
}

export function ExchangeStockFilters({
  filters,
  onChange,
  sectors,
}: {
  filters: StockExchangeFilters;
  onChange: (next: StockExchangeFilters) => void;
  sectors: string[];
}) {
  const selectSector = (sector: string | null) => {
    gameAudio.playSfx('buttonClick');
    onChange({ ...filters, sector });
  };

  return (
    <section className="exchange-filters" aria-label="Фильтр по сектору">
      <div className="exchange-filters__chips" role="group" aria-label="Сектор">
        <SectorChip
          active={filters.sector === null}
          label="Все"
          onClick={() => selectSector(null)}
        />
        {sectors.map((sector) => (
          <SectorChip
            key={sector}
            sector={sector}
            active={filters.sector === sector}
            label={formatSectorLabel(sector)}
            onClick={() => selectSector(filters.sector === sector ? null : sector)}
          />
        ))}
      </div>
    </section>
  );
}
