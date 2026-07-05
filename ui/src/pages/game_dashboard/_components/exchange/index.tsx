import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../../../stores/game.store';
import { useDashboardUi } from '../../_model/dashboard_ui_context';
import { useDashboardTheme } from '../../_model/use_dashboard_theme';
import {
  realEstateCardsContainerVariants,
  realEstateOfferCardVariants,
} from '../../_model/real_estate_panel_animation';
import type { StockListing } from '../../../../api/stocks';
import { StockCard } from './_stock_card';
import { StockChartModal } from './_stock_chart_modal';
import { StockBuyModal } from './_stock_buy_modal';
import { PortfolioSummary } from './_portfolio_summary';
import { format_change } from '../../_model/utils';
import { MoneyValue } from '../../../../components/money/money_value';
import { TrendArrow } from './_trend_arrow';
import { PanelSectionHeading } from '../shared';
import { ExchangeStockFilters } from './_exchange_stock_filters';
import { ExchangeTabs, type ExchangeTabId } from './_exchange_tabs';
import { ExchangeMarketSpotlight } from './_exchange_market_spotlight';
import {
  collectListingSectors,
  DEFAULT_STOCK_EXCHANGE_FILTERS,
  filterStockListings,
  splitMarketListings,
  type StockExchangeFilters,
} from './_exchange_filter_utils';
import './_exchange.css';

export function ExchangeTable() {
  const theme = useDashboardTheme();
  const { highlightStockListingId, clearHighlightStockListing } = useDashboardUi();
  const portfolio = useGameStore((state) => state.portfolio);
  const stockListings = useGameStore((state) => state.stockListings);
  const ipos = useGameStore((state) => state.ipos);
  const availableCash = useGameStore((state) => state.balance);
  const turn = useGameStore((state) => state.turn);
  const stockBusy = useGameStore((state) => state.stockBusy);
  const buyStock = useGameStore((state) => state.buyStock);
  const subscribeToIpo = useGameStore((state) => state.subscribeToIpo);
  const loadExchangeData = useGameStore((state) => state.loadExchangeData);

  const [chartListing, setChartListing] = useState<StockListing | null>(null);
  const [buyListing, setBuyListing] = useState<StockListing | null>(null);
  const [chartHistory, setChartHistory] = useState<{ turn: number; price: number }[]>([]);
  const [filters, setFilters] = useState<StockExchangeFilters>(DEFAULT_STOCK_EXCHANGE_FILTERS);
  const [activeTab, setActiveTab] = useState<ExchangeTabId>('market');

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
        <ExchangeMarketSpotlight
          ipos={ipos}
          insiderListings={listingGroups.insider}
          ipoTrackListings={listingGroups.ipoTrack}
          currentTurn={turn}
          stockBusy={stockBusy}
          highlightStockListingId={highlightStockListingId}
          onSubscribe={subscribeToIpo}
          onOpenChart={(listing) => void openChart(listing)}
        />

        <ExchangeStockFilters
          filters={filters}
          onChange={setFilters}
          sectors={sectors}
          matchedCount={filteredListings.length}
          totalCount={listingGroups.catalog.length}
        />

        <ExchangeTabs
          active={activeTab}
          onChange={setActiveTab}
          portfolioCount={portfolio.length}
        />

        {activeTab === 'market' ? (
          <>
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
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </>
        ) : (
          <>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h3 className={`text-lg font-bold tracking-wider ${theme.primaryText}`}>Портфель</h3>
                <p className={`mt-1 text-sm ${theme.secondaryText}`}>Биржевые позиции</p>
              </div>
              <span className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 ring-1 ring-emerald-500/20">
                {portfolio.length} позиций
              </span>
            </div>

            <PortfolioSummary portfolio={portfolio} availableCash={availableCash} />

            <div className="rounded-[24px] border border-slate-700/40 shadow-inner shadow-black/20 ring-1 ring-slate-700/20">
              <table className="w-full min-w-lg text-left text-sm">
                <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wider text-slate-400 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-3 font-bold">Тикер</th>
                    <th className="px-4 py-3 font-bold">Компания</th>
                    <th className="px-4 py-3 text-right font-bold">Кол-во</th>
                    <th className="px-4 py-3 text-right font-bold">Цена</th>
                    <th className="px-4 py-3 text-right font-bold">Доходность</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((row) => (
                    <tr
                      key={row.ticker}
                      className="border-t border-slate-700/30 transition-colors duration-200 hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400/90">{row.ticker}</td>
                      <td className={`px-4 py-3 ${theme.secondaryText}`}>{row.name}</td>
                      <td className="px-4 py-3 text-right font-medium text-white">{row.qty}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end">
                          <MoneyValue amount={row.price} size="sm" color="white" />
                        </div>
                      </td>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <StockChartModal
        open={Boolean(chartListing)}
        listing={chartListing}
        history={chartHistory}
        onClose={() => setChartListing(null)}
        onBuy={
          chartListing && !chartListing.isLocked && chartListing.availableOnExchange
            ? () => {
                setBuyListing(chartListing);
                setChartListing(null);
              }
            : undefined
        }
      />

      <StockBuyModal
        open={Boolean(buyListing)}
        listing={buyListing}
        balance={availableCash}
        busy={stockBusy}
        onClose={() => setBuyListing(null)}
        onConfirm={async (quantity) => {
          if (!buyListing) return;
          await buyStock(buyListing.id, quantity);
          setBuyListing(null);
        }}
      />
    </div>
  );
}
