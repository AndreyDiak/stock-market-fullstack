import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { profit_grade } from '../../_model/types';
import { formatSectorLabel } from './_stock_grade_config';
import {
  countActiveStockFilters,
  DEFAULT_STOCK_EXCHANGE_FILTERS,
  type StockExchangeFilters,
} from './_exchange_filter_utils';

const GRADES: profit_grade[] = ['F', 'E', 'D', 'C', 'B', 'A'];

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`exchange-filters__chip${active ? ' exchange-filters__chip--active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
}

export function ExchangeStockFilters({
  filters,
  onChange,
  sectors,
  matchedCount,
  totalCount,
}: {
  filters: StockExchangeFilters;
  onChange: (next: StockExchangeFilters) => void;
  sectors: string[];
  matchedCount: number;
  totalCount: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeFilterCount = countActiveStockFilters(filters);
  const hasActiveFilters = activeFilterCount > 0;

  const setPartial = (patch: Partial<StockExchangeFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const resetFilters = () => {
    onChange(DEFAULT_STOCK_EXCHANGE_FILTERS);
  };

  const resultLabel =
    matchedCount === totalCount ? `${totalCount} бумаг` : `${matchedCount} из ${totalCount}`;

  return (
    <section className={`exchange-filters${expanded ? ' exchange-filters--expanded' : ''}`}>
      <button
        type="button"
        className="exchange-filters__toggle"
        aria-expanded={expanded}
        aria-controls="exchange-filters-panel"
        onClick={() => setExpanded((value) => !value)}
      >
        <span className="exchange-filters__toggle-main">
          <span className="exchange-filters__toggle-title">Фильтры</span>
          {hasActiveFilters ? (
            <span className="exchange-filters__toggle-badge">{activeFilterCount}</span>
          ) : null}
        </span>

        <span className="exchange-filters__toggle-meta">
          <span className="exchange-filters__summary-count">{resultLabel}</span>
          <span className="exchange-filters__toggle-chevron" aria-hidden />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            id="exchange-filters-panel"
            key="exchange-filters-panel"
            className="exchange-filters__panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="exchange-filters__panel-inner">
              <div className="exchange-filters__search-row">
                <label className="exchange-filters__search">
                  <span className="exchange-filters__search-icon" aria-hidden>
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={filters.query}
                    onChange={(event) => setPartial({ query: event.target.value })}
                    placeholder="Тикер или компания"
                    className="exchange-filters__search-input"
                    aria-label="Поиск по тикеру или названию компании"
                  />
                </label>

                {hasActiveFilters ? (
                  <button type="button" className="exchange-filters__reset" onClick={resetFilters}>
                    Сбросить
                  </button>
                ) : null}
              </div>

              <div className="exchange-filters__groups">
                <div className="exchange-filters__group" role="group" aria-label="Сектор">
                  <span className="exchange-filters__group-label">Сектор</span>
                  <div className="exchange-filters__chips">
                    <FilterChip
                      active={filters.sector === null}
                      label="Все"
                      onClick={() => setPartial({ sector: null })}
                    />
                    {sectors.map((sector) => (
                      <FilterChip
                        key={sector}
                        active={filters.sector === sector}
                        label={formatSectorLabel(sector)}
                        onClick={() =>
                          setPartial({ sector: filters.sector === sector ? null : sector })
                        }
                      />
                    ))}
                  </div>
                </div>

                <div className="exchange-filters__group" role="group" aria-label="Класс бумаги">
                  <span className="exchange-filters__group-label">Класс</span>
                  <div className="exchange-filters__chips">
                    <FilterChip
                      active={filters.grade === null}
                      label="Все"
                      onClick={() => setPartial({ grade: null })}
                    />
                    {GRADES.map((grade) => (
                      <FilterChip
                        key={grade}
                        active={filters.grade === grade}
                        label={grade}
                        onClick={() => setPartial({ grade: filters.grade === grade ? null : grade })}
                      />
                    ))}
                  </div>
                </div>

                <div className="exchange-filters__group" role="group" aria-label="Доступность">
                  <span className="exchange-filters__group-label">Покупка</span>
                  <div className="exchange-filters__chips">
                    <FilterChip
                      active={!filters.onlyAvailable}
                      label="Все"
                      onClick={() => setPartial({ onlyAvailable: false })}
                    />
                    <FilterChip
                      active={filters.onlyAvailable}
                      label="Доступные мне"
                      onClick={() => setPartial({ onlyAvailable: true })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
