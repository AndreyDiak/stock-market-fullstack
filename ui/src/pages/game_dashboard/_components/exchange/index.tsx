import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../stores/game.store';
import { useDashboardUi } from '../../_model/dashboard_ui_context';
import { useDashboardTheme } from '../../_model/use_dashboard_theme';
import {
  realEstateCardsContainerVariants,
  realEstateOfferCardVariants,
} from '../../_model/real_estate_panel_animation';
import type { PortfolioRow, StockListing } from '../../../../api/stocks';
import type { portfolio_row } from '../../_model/types';
import { StockCard } from './_stock_card';
import { StockChartModal } from './_stock_chart_modal';
import { StockSellModal } from './_stock_sell_modal';
import { GameButton } from '../../../../components/game_ui/game_button';
import { gameAudio } from '../../../../lib/audio/game_audio';
import { PortfolioSummary } from './_portfolio_summary';
import { format_change } from '../../_model/utils';
import { MoneyValue } from '../../../../components/money/money_value';
import { TrendArrow } from './_trend_arrow';
import { formatSectorLabel } from './_stock_grade_config';
import { getSectorIcon } from './_sector_icons';
import { PanelSectionHeading } from '../shared';
import { ExchangeStockFilters } from './_exchange_stock_filters';
import { ExchangeTabs, type ExchangeTabId } from './_exchange_tabs';
import { ExchangeMarketSpotlight } from './_exchange_market_spotlight';
import { AnalyticsTab } from './_analytics_tab';
import { TradeHistoryTab } from './_trade_history_tab';
import {
  collectListingSectors,
  DEFAULT_STOCK_EXCHANGE_FILTERS,
  filterStockListings,
  splitMarketListings,
  type StockExchangeFilters,
} from './_exchange_filter_utils';
import './_exchange.css';

const SECTOR_COLORS: Record<string, string> = {
  TECHNOLOGY: '#38bdf8',
  HEALTHCARE: '#fb7185',
  FINANCE: '#fbbf24',
  AGRICULTURE: '#34d399',
  ENERGY: '#a78bfa',
}

export function ExchangeTable() {
  const theme = useDashboardTheme();
  const { highlightStockListingId, clearHighlightStockListing, openNewsTab, setHighlightNewsId, openExchangeTab } =
    useDashboardUi();
  const portfolio = useGameStore((state) => state.portfolio);
  const stockListings = useGameStore((state) => state.stockListings);
  const ipos = useGameStore((state) => state.ipos);
  const availableCash = useGameStore((state) => state.balance);
  const turn = useGameStore((state) => state.turn);
  const stockBusy = useGameStore((state) => state.stockBusy);
  const characterStats = useGameStore((state) => state.characterStats);
  const buyStock = useGameStore((state) => state.buyStock);
  const sellStock = useGameStore((state) => state.sellStock);
  const subscribeToIpo = useGameStore((state) => state.subscribeToIpo);
  const loadExchangeData = useGameStore((state) => state.loadExchangeData);

  const [chartListing, setChartListing] = useState<StockListing | null>(null);
  const [sellRow, setSellRow] = useState<portfolio_row | null>(null);
  const [chartHistory, setChartHistory] = useState<{ turn: number; price: number }[]>([]);
  const [filters, setFilters] = useState<StockExchangeFilters>(DEFAULT_STOCK_EXCHANGE_FILTERS);
  const [activeTab, setActiveTab] = useState<ExchangeTabId>('market');
  const [sortKey, setSortKey] = useState<'name' | 'price' | 'qty'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    void loadExchangeData();
  }, [loadExchangeData]);

  useEffect(() => {
    if (!highlightStockListingId) return;
    setActiveTab('market');
    const node = document.getElementById(`stock-listing-${highlightStockListingId}`);
    node?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = window.setTimeout(() => clearHighlightStockListing(), 2500);
    return () => window.clearTimeout(timer);
  }, [highlightStockListingId, stockListings, clearHighlightStockListing]);

  const sortedListings = useMemo(
    () => [...stockListings].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    [stockListings],
  );

  const listingGroups = useMemo(() => splitMarketListings(sortedListings), [sortedListings]);

  const sectors = useMemo(
    () => collectListingSectors(listingGroups.catalog),
    [listingGroups.catalog],
  );

  const filteredListings = useMemo(
    () => filterStockListings(listingGroups.catalog, filters),
    [listingGroups.catalog, filters],
  );

  const newsFeed = useGameStore((state) => state.news);

  const tickerToSector = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of stockListings) map.set(s.ticker, s.sector)
    return map
  }, [stockListings])

  const sortedPortfolio = useMemo(() => {
    const sorted = [...portfolio]
    if (sortKey === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortKey === 'price') {
      sorted.sort((a, b) => a.price - b.price)
    } else if (sortKey === 'qty') {
      sorted.sort((a, b) => a.qty - b.qty)
    }
    return sortDir === 'desc' ? sorted.reverse() : sorted
  }, [portfolio, sortKey, sortDir])

  const toggleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortArrow = (key: typeof sortKey) => {
    if (sortKey !== key) return null
    return sortDir === 'asc' ? ' ▲' : ' ▼'
  }

  const handleInsiderClick = (ticker: string) => {
    const insiderNews = newsFeed.find(
      (n) => n.ticker === ticker && n.kind === 'INSIDER',
    );
    if (insiderNews) {
      setHighlightNewsId(insiderNews.id);
    }
    openNewsTab();
  };

  const openChart = async (listing: StockListing) => {
    setChartListing(listing);
    if (listing.history && listing.history.length >= 2) {
      setChartHistory(listing.history);
      return;
    }
    const history = await useGameStore.getState().fetchStockHistory(listing.id);
    setChartHistory(history);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <header className="mb-4 shrink-0 px-1">
        <PanelSectionHeading
          title="Биржа"
          subtitle={`${sortedListings.length} бумаг · ${portfolio.length} в портфеле`}
        />
      </header>

      <div className={`min-h-0 flex-1 overflow-auto px-1 pb-2 ${theme.scrollArea}`}>
        <div className="sticky top-0 z-10 bg-slate-900/95 pb-3 pt-1 backdrop-blur-sm">
          <ExchangeTabs
            active={activeTab}
            onChange={(tab) => { gameAudio.playSfx('buttonClick'); setActiveTab(tab); }}
            portfolioCount={portfolio.length}
          />
        </div>

        <ExchangeMarketSpotlight
          ipos={ipos}
          insiderListings={listingGroups.insider}
          ipoTrackListings={listingGroups.ipoTrack}
          currentTurn={turn}
          stockBusy={stockBusy}
          highlightStockListingId={highlightStockListingId}
          onSubscribe={subscribeToIpo}
          onOpenChart={(listing) => void openChart(listing)}
          onInsiderClick={handleInsiderClick}
        />

        {activeTab === 'market' ? (
          <>
            <ExchangeStockFilters
              filters={filters}
              onChange={setFilters}
              sectors={sectors}
              matchedCount={filteredListings.length}
              totalCount={listingGroups.catalog.length}
            />
            {filteredListings.length === 0 ? (
              <div className="exchange-empty">
                <p className="exchange-empty__title">Ничего не найдено</p>
                <p className="exchange-empty__text">Измените фильтры или очистите поиск</p>
              </div>
            ) : (
              <motion.div
                className="mb-6 grid grid-cols-1 items-stretch gap-5 min-[720px]:grid-cols-2"
                variants={realEstateCardsContainerVariants}
                initial="hidden"
                animate="show"
              >
                {filteredListings.map((listing) => (
                  <motion.div key={listing.id} variants={realEstateOfferCardVariants} className="flex min-w-0">
                    <StockCard
                      listing={listing}
                      highlighted={listing.id === highlightStockListingId}
                      onOpenChart={() => void openChart(listing)}
                      onInsiderClick={() => handleInsiderClick(listing.ticker)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        ) : activeTab === 'history' ? (
          <TradeHistoryTab />
        ) : activeTab === 'analytics' ? (
          <AnalyticsTab
            stockListings={sortedListings}
            portfolio={portfolio}
            news={newsFeed}
            turn={turn}
            openNewsTab={openNewsTab}
            setHighlightNewsId={setHighlightNewsId}
            openExchangeTab={openExchangeTab}
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.05 } },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
              }}
            >
              <PortfolioSummary portfolio={portfolio} />
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
              }}
              className="rounded-[24px] border border-slate-700/40 shadow-inner shadow-black/20 ring-1 ring-slate-700/20"
            >
              <table className="w-full min-w-lg text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wider text-slate-400 backdrop-blur-sm [&_th:first-child]:rounded-tl-[24px] [&_th:last-child]:rounded-tr-[24px]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Тикер</th>
                    <th className="px-4 py-3 font-bold">
                      <button type="button" className="inline-flex items-center gap-1 hover:text-white transition-colors" onClick={() => toggleSort('name')}>
                        Компания{sortArrow('name')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      <button type="button" className="inline-flex items-center gap-1 hover:text-white transition-colors" onClick={() => toggleSort('price')}>
                        Цена{sortArrow('price')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-bold">
                      <button type="button" className="inline-flex items-center gap-1 hover:text-white transition-colors" onClick={() => toggleSort('qty')}>
                        Кол-во{sortArrow('qty')}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right font-bold">Доходность</th>
                    <th className="px-4 py-3 font-bold">Сектор</th>
                    <th className="px-4 py-3 text-right font-bold" />
                  </tr>
                </thead>
                <tbody>
                  {sortedPortfolio.map((row, i) => {
                    const sector = tickerToSector.get(row.ticker)
                    const listing = stockListings.find((s) => s.ticker === row.ticker)
                    const SectorIcon = sector ? getSectorIcon(sector) : null
                    const sectorColor = sector ? (SECTOR_COLORS[sector] ?? '#94a3b8') : null
                    return (
                      <motion.tr
                        key={row.ticker}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.035, type: 'spring', stiffness: 280, damping: 26 }}
                        className="border-t border-slate-700/30 transition-colors duration-200 hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-mono font-bold text-emerald-400/90">{row.ticker}</td>
                        <td className={`px-4 py-3 ${theme.secondaryText}`}>{row.name}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <MoneyValue amount={row.price} size="sm" color="white" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-white">{row.qty}</td>
                        <td
                          className={`px-4 py-3 text-right font-bold ${
                            row.changePct >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          <span className="inline-flex items-center justify-end gap-1">
                            {format_change(row.changePct)}
                            <TrendArrow up={row.changePct >= 0} />
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                            {sector && sectorColor ? (
                              <>
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sectorColor }} />
                                {SectorIcon ? <SectorIcon className="w-3.5 h-3.5" aria-hidden style={{ color: sectorColor, opacity: 0.75 }} /> : null}
                                <span style={{ color: sectorColor }}>{formatSectorLabel(sector)}</span>
                              </>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {listing ? (
                              <GameButton size="sm" variant="emerald" onClick={() => void openChart(listing)}>
                                Подробнее
                              </GameButton>
                            ) : null}
                            {row.listingId ? (
                              <GameButton
                                size="sm"
                                variant="muted"
                                disabled={stockBusy}
                                onClick={() => setSellRow(row)}
                              >
                                Продать
                              </GameButton>
                            ) : null}
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </div>

      <StockChartModal
        open={Boolean(chartListing)}
        listing={chartListing}
        history={chartHistory}
        portfolio={portfolio}
        balance={availableCash}
        stockBusy={stockBusy}
        onClose={() => setChartListing(null)}
        onBuy={async (listingId, quantity) => {
          try {
            await buyStock(listingId, quantity);
            gameAudio.playSfx('dealSuccess');
          } finally {
            setChartListing(null);
          }
        }}
        onInsiderClick={chartListing ? () => handleInsiderClick(chartListing.ticker) : undefined}
      />

      <StockSellModal
        open={Boolean(sellRow)}
        row={
          sellRow && sellRow.listingId
            ? ({
                ...sellRow,
                listingId: sellRow.listingId,
                purchasePrice: 0,
                pnl: 0,
                turnsHeldInCycle: sellRow.turnsHeldInCycle ?? 0,
              } satisfies PortfolioRow)
            : null
        }
        listing={sellRow ? (stockListings.find((s) => s.ticker === sellRow.ticker) ?? null) : null}
        commissionPercent={characterStats.sellCommissionPercent}
        busy={stockBusy}
        onClose={() => setSellRow(null)}
        onConfirm={async (quantity) => {
          try {
            if (!sellRow?.listingId) return;
            await sellStock(sellRow.listingId, quantity);
            gameAudio.playSfx('dealSuccess');
          } finally {
            setSellRow(null);
          }
        }}
      />
    </div>
  );
}
