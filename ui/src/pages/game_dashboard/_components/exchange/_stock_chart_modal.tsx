import { useMemo, useState } from 'react';
import { GameModal } from '../../../../components/game_ui/floating';
import { GameButton } from '../../../../components/game_ui/game_button';
import { MoneyValue, formatMoney } from '../../../../components/money/money_value';
import type { PriceHistoryPoint, StockListing } from '../../../../api/stocks';
import type { portfolio_row } from '../../_model/types';
import { StockSparkline } from './_stock_sparkline';
import { getHistoryWindowMeta, getSparklineDisplayHistory, resolveListingHistory } from './_stock_sparkline_utils';
import { StockChangeBadge } from './_stock_change_badge';
import { format_change, format_turns_left_label } from '../../_model/utils';
import { SectorBadge } from './_sector_badge';
import { ProfitGradeBadge } from '../real_estate/_profit_grade_badge';
import { STOCK_GRADE_CONFIG, formatSectorLabel } from './_stock_grade_config';
import { gameAudio } from '../../../../lib/audio/game_audio';
import { calcFullDividendPayout } from './_dividend_utils';

interface StockChartModalProps {
  open: boolean;
  listing: StockListing | null;
  history: PriceHistoryPoint[];
  portfolio: portfolio_row[];
  balance: number;
  stockBusy?: boolean;
  onClose: () => void;
  onBuy: (listingId: string, quantity: number) => Promise<void>;
  onInsiderClick?: () => void;
}

export function StockChartModal({
  open,
  listing,
  history,
  portfolio,
  balance,
  stockBusy,
  onClose,
  onBuy,
  onInsiderClick,
}: StockChartModalProps) {
  const [quantity, setQuantity] = useState(1);

  const position = useMemo(
    () => portfolio.find((p) => p.ticker === listing?.ticker),
    [portfolio, listing],
  );

  const chartHistory = useMemo(
    () => (listing ? resolveListingHistory(listing, history) : []),
    [listing, history],
  );
  const displayHistory = useMemo(() => getSparklineDisplayHistory(chartHistory), [chartHistory]);
  const periodMeta = useMemo(() => getHistoryWindowMeta(chartHistory), [chartHistory]);
  const turnUp = (listing?.dayChange ?? 0) >= 0;

  const prices = useMemo(() => displayHistory.map((p) => p.price), [displayHistory]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const totalCost = listing ? listing.currentPrice * quantity : 0;
  const canAfford = totalCost <= balance;
  const locked = listing ? listing.isLocked || !listing.availableOnExchange : true;
  const totalQtyAfterBuy = (position?.qty ?? 0) + quantity;
  const projectedDividendPayout = useMemo(
    () => calcFullDividendPayout(listing?.dividendPerShare, totalQtyAfterBuy),
    [listing?.dividendPerShare, totalQtyAfterBuy],
  );
  const currentPositionDividendPayout = useMemo(
    () => calcFullDividendPayout(listing?.dividendPerShare, position?.qty ?? 0),
    [listing?.dividendPerShare, position?.qty],
  );

  const gradeConfig = listing ? STOCK_GRADE_CONFIG[listing.grade] : null;

  const handleQuantityChange = (value: number) => {
    gameAudio.playSfx('buttonClick');
    setQuantity(Math.max(1, value));
  };

  const handleMax = () => {
    if (!listing) return;
    gameAudio.playSfx('buttonClick');
    const maxQty = Math.floor(balance / listing.currentPrice);
    setQuantity(Math.max(1, maxQty));
  };

  const handleBuy = () => {
    if (!listing || quantity < 1) return;
    gameAudio.playSfx('buttonClick');
    void onBuy(listing.id, quantity);
  };

  const detailRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );

  if (!listing) return null;

  return (
    <GameModal
      open={open}
      onClose={onClose}
      labelledBy="stock-chart-title"
      panelClassName="pointer-events-auto w-full max-w-[900px]"
    >
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-900/95 p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div id="stock-chart-title" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-bold text-white">
              <span className="font-mono text-emerald-400">{listing.ticker}</span>
              <span className="text-slate-500">·</span>
              <span className="truncate">{listing.name}</span>
              <SectorBadge sector={listing.sector} />
              <ProfitGradeBadge grade={listing.grade} embedded />
              {listing.hasInsiderPressure ? (
                <button
                  type="button"
                  onClick={onInsiderClick}
                  className="cursor-pointer rounded-lg border border-rose-500/40 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200 transition-colors hover:border-rose-400/60 hover:bg-rose-500/25"
                >
                  Инсайд
                </button>
              ) : listing.hasNewsPressure ? (
                <span className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-200">
                  Есть новости
                </span>
              ) : null}
              {listing.paysDividends ? (
                <span className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                  Дивиденды
                </span>
              ) : null}
              {locked ? (
                <span className="rounded-lg border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  Заблокирована
                </span>
              ) : null}
            </div>
            {position ? (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/8 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
                  В портфеле: {position.qty} шт.
                </span>
                <span
                  className={`inline-flex items-center text-[11px] font-bold ${
                    position.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {format_change(position.changePct)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Change badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <StockChangeBadge
            value={listing.dayChange}
            emphasis="primary"
            ariaLabel="Изменение за ход"
          />
          <StockChangeBadge
            label="Период"
            value={periodMeta.changePct}
            emphasis="secondary"
            ariaLabel="Изменение за период графика"
          />
        </div>

        {/* Chart */}
        <div className="mb-4 rounded-xl border border-slate-700/40 bg-slate-950/60 p-4">
          <div className="h-52">
            <StockSparkline
              history={displayHistory}
              up={turnUp}
              width={640}
              height={220}
              className="h-full [&>svg]:!h-full"
            />
          </div>
          {minPrice !== null && maxPrice !== null && (
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>За период: {formatMoney(minPrice)} – {formatMoney(maxPrice)}</span>
            </div>
          )}
        </div>

        {/* Two-column layout on desktop */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-stretch">
          {/* Left: Сводка */}
          <div className="flex w-72 shrink-0 flex-col">
            <div className="flex flex-1 flex-col rounded-xl border border-slate-700/40 bg-slate-950/50 p-3.5">
              <h4 className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Сводка
              </h4>
              <div className="space-y-1.5">
                {detailRow('Цена', <MoneyValue amount={listing.currentPrice} size="sm" color="white" />)}
                {detailRow('Сектор', <span className="text-xs text-slate-300">{formatSectorLabel(listing.sector)}</span>)}
                {detailRow('Класс', <span className="text-xs font-bold text-white">{listing.grade}</span>)}
                {detailRow(
                  'Доступность',
                  locked ? (
                    <span className="text-xs text-rose-400">Заблокирована</span>
                  ) : (
                    <span className="text-xs text-emerald-400">Открыта</span>
                  ),
                )}
              </div>

              {/* Position rows */}
              {position ? (
                <>
                  <div className="my-2 border-t border-slate-700/30" />
                  <div className="space-y-1.5">
                    {detailRow('Позиция', <span className="text-sm font-bold text-white">{position.qty} шт.</span>)}
                    {detailRow('Средняя цена', <span className="text-xs text-slate-300">{formatMoney(position.price)}</span>)}
                    {detailRow(
                      'Стоимость',
                      <MoneyValue amount={position.price * position.qty} size="sm" color="white" />,
                    )}
                    {detailRow(
                      'Доходность',
                      <span
                        className={`text-xs font-bold ${
                          position.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {format_change(position.changePct)}
                      </span>,
                    )}
                  </div>
                </>
              ) : null}

              {/* Dividends */}
              {listing.paysDividends ? (
                <>
                  {position && <div className="my-2 border-t border-slate-700/30" />}
                  <div className="space-y-1.5">
                    {detailRow('Статус', <span className="text-xs text-amber-300">Платит дивиденды</span>)}
                    {listing.turnsUntilDividend !== null
                      ? detailRow(
                          'Следующая выплата',
                          <span className="text-xs text-slate-300">
                            через {listing.turnsUntilDividend} ход{listing.turnsUntilDividend !== 1 ? 'ов' : ''}
                          </span>,
                        )
                      : null}
                    {listing.dividendPerShare != null
                      ? detailRow(
                          'Дивиденд за акцию',
                          <MoneyValue amount={listing.dividendPerShare} size="sm" color="emerald" />,
                        )
                      : null}
                    {currentPositionDividendPayout != null
                      ? detailRow(
                          'Ожидаемая выплата',
                          <MoneyValue amount={currentPositionDividendPayout} size="sm" color="emerald" />,
                        )
                      : null}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Right: Покупка */}
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex flex-1 flex-col rounded-xl border border-slate-700/40 bg-slate-950/50 p-3.5">
              <h4 className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {locked ? 'Покупка недоступна' : 'Покупка'}
              </h4>

              {locked ? (
                <div className="space-y-2">
{!listing.availableOnExchange ? (
                      <p className="rounded-lg border border-slate-600/30 bg-slate-800/40 px-3 py-2 text-xs text-slate-300">
                        Акция торгуется только через IPO.
                      </p>
                    ) : gradeConfig ? (
                      <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                        Требуется уровень трейдинга {gradeConfig.minTradingLevel}
                        {gradeConfig.minReputation > 0
                          ? ` и репутация ${gradeConfig.minReputation}`
                          : ''}.
                      </p>
                    ) : null}
                </div>
              ) : (
                <>
                  {/* Quantity row: label + quick select */}
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Количество</span>
                    <div className="flex gap-1">
                      {[-10, -5, -1, 1, 5, 10].map((delta) => (
                        <button
                          key={delta}
                          type="button"
                          disabled={stockBusy || quantity + delta < 1}
                          onClick={() => handleQuantityChange(quantity + delta)}
                          className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                        >
                          {delta > 0 ? `+${delta}` : `${delta}`}
                        </button>
                      ))}
                      <button
                        type="button"
                        disabled={stockBusy || quantity <= 1}
                        onClick={() => handleQuantityChange(1)}
                        className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                      >
                        Min
                      </button>
                      <button
                        type="button"
                        disabled={stockBusy}
                        onClick={handleMax}
                        className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-amber-400 transition hover:bg-slate-700 disabled:opacity-30"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                  {/* Quantity input with +/- */}
                  <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/60 px-3 py-2">
                    <button
                      type="button"
                      disabled={quantity <= 1 || stockBusy}
                      onClick={() => handleQuantityChange(quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-30"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      disabled={stockBusy}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (val >= 1 || e.target.value === '') handleQuantityChange(val || 1);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-center font-mono text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      disabled={stockBusy}
                      onClick={() => handleQuantityChange(quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  {/* Financial rows */}
                  <div className="space-y-1">
                    {detailRow(
                      'Итого',
                      <MoneyValue amount={totalCost} size="sm" color={canAfford ? 'white' : 'red'} />,
                    )}
                    {detailRow(
                      'Доступно',
                      <MoneyValue amount={balance} size="sm" color="cyan" />,
                    )}
                    {detailRow(
                      'После покупки',
                      <MoneyValue
                        amount={Math.max(0, balance - totalCost)}
                        size="sm"
                        color={canAfford ? 'emerald' : 'red'}
                      />,
                    )}
                    {projectedDividendPayout != null ? (
                      detailRow(
                        'Выплата дивидендов',
                        <div className="text-right">
                          <MoneyValue amount={projectedDividendPayout} size="sm" color="emerald" />
                          <p className="mt-0.5 text-[10px] font-medium leading-tight text-slate-500">
                            за {totalQtyAfterBuy} акций
                            {listing.turnsUntilDividend != null
                              ? ` · через ${format_turns_left_label(listing.turnsUntilDividend)}`
                              : ''}
                          </p>
                        </div>,
                      )
                    ) : null}
                  </div>

                  {!canAfford && (
                    <p className="mt-2 text-xs text-rose-400">Недостаточно средств на балансе</p>
                  )}
                </>
              )}

              {/* Buttons */}
              <div className="mt-auto flex gap-2 pt-3">
                <GameButton size="sm" variant="muted" onClick={onClose}>
                  Закрыть
                </GameButton>
                {!locked && (
                  <GameButton
                    size="sm"
                    variant="emerald"
                    className="flex-1"
                    disabled={stockBusy || !canAfford || quantity < 1}
                    onClick={handleBuy}
                  >
                    {!canAfford
                      ? 'Недостаточно средств'
                      : stockBusy
                        ? 'Покупка...'
                        : `Купить ${quantity} шт. за ${formatMoney(totalCost)}`}
                  </GameButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameModal>
  );
}
