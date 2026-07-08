import { useMemo, useState } from 'react';
import { GameModal } from '../../../../components/game_ui/floating';
import { GameButton } from '../../../../components/game_ui/game_button';
import { MoneyValue, formatMoney } from '../../../../components/money/money_value';
import type { PortfolioRow, StockListing } from '../../../../api/stocks';
import { StockSparkline } from './_stock_sparkline';
import { getHistoryWindowMeta, getSparklineDisplayHistory, resolveListingHistory } from './_stock_sparkline_utils';
import { StockChangeBadge } from './_stock_change_badge';
import { format_change } from '../../_model/utils';
import { gameAudio } from '../../../../lib/audio/game_audio';

export function StockSellModal({
  open,
  row,
  listing,
  commissionPercent,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  row: PortfolioRow | null;
  listing: StockListing | null;
  commissionPercent: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);

  const maxQty = row?.qty ?? 0;
  const currentPrice = listing?.currentPrice ?? row?.price ?? 0;

  const chartHistory = useMemo(
    () => (listing ? resolveListingHistory(listing, listing.history ?? []) : []),
    [listing],
  );
  const displayHistory = useMemo(() => getSparklineDisplayHistory(chartHistory), [chartHistory]);
  const periodMeta = useMemo(() => getHistoryWindowMeta(chartHistory), [chartHistory]);
  const turnUp = (listing?.dayChange ?? 0) >= 0;

  const prices = useMemo(() => displayHistory.map((p) => p.price), [displayHistory]);
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

  const gross = useMemo(() => currentPrice * quantity, [currentPrice, quantity]);
  const commissionAmount = useMemo(
    () => Number((gross * (commissionPercent / 100)).toFixed(2)),
    [gross, commissionPercent],
  );
  const net = useMemo(() => Number((gross - commissionAmount).toFixed(2)), [gross, commissionAmount]);

  const profitPerShare = currentPrice - (row?.price ?? 0);
  const totalProfit = profitPerShare * quantity;

  const handleQuantityChange = (value: number) => {
    gameAudio.playSfx('buttonClick');
    setQuantity(Math.max(1, Math.min(maxQty, value)));
  };

  const handleMax = () => {
    gameAudio.playSfx('buttonClick');
    setQuantity(maxQty);
  };

  if (!row) return null;

  const hasChart = displayHistory.length >= 2;

  return (
    <GameModal open={open} onClose={onClose} labelledBy="stock-sell-title" panelClassName="pointer-events-auto w-full max-w-[540px]">
      <div className="max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-900/95 p-5 shadow-2xl sm:p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 id="stock-sell-title" className="text-lg font-bold text-white">
            Продажа <span className="font-mono text-emerald-400">{row.ticker}</span>
          </h3>
          <p className="mt-1 text-sm text-slate-400">{row.name}</p>
        </div>

        {/* Chart */}
        {hasChart ? (
          <div className="mb-4 rounded-xl border border-slate-700/40 bg-slate-950/60 p-3">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <StockChangeBadge value={listing!.dayChange} emphasis="primary" ariaLabel="Изменение за ход" />
              <StockChangeBadge label="Период" value={periodMeta.changePct} emphasis="secondary" ariaLabel="Изменение за период графика" />
            </div>
            <div className="h-36">
              <StockSparkline
                history={displayHistory}
                up={turnUp}
                width={480}
                height={140}
                className="h-full [&>svg]:!h-full"
              />
            </div>
            {minPrice !== null && maxPrice !== null && (
              <div className="mt-1 flex justify-between text-[10px] text-slate-500">
                <span>{formatMoney(minPrice)} – {formatMoney(maxPrice)}</span>
              </div>
            )}
          </div>
        ) : null}

        {/* Quantity */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Количество</span>
          <div className="flex gap-1">
            {[-10, -5, -1, 1, 5, 10].map((delta) => {
              const next = quantity + delta
              return (
                <button
                  key={delta}
                  type="button"
                  disabled={busy || next < 1 || next > maxQty}
                  onClick={() => handleQuantityChange(next)}
                  className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
                >
                  {delta > 0 ? `+${delta}` : `${delta}`}
                </button>
              )
            })}
            <button
              type="button"
              disabled={busy || quantity <= 1}
              onClick={() => handleQuantityChange(1)}
              className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-400 transition hover:bg-slate-700 hover:text-white disabled:opacity-30"
            >
              Min
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleMax}
              className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-rose-400 transition hover:bg-slate-700 disabled:opacity-30"
            >
              Max
            </button>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/60 px-3 py-2">
          <button
            type="button"
            disabled={quantity <= 1 || busy}
            onClick={() => handleQuantityChange(quantity - 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-30"
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={maxQty}
            value={quantity}
            disabled={busy}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (val >= 1 || e.target.value === '') handleQuantityChange(val || 1);
            }}
            className="min-w-0 flex-1 bg-transparent text-center font-mono text-lg font-bold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <button
            type="button"
            disabled={busy || quantity >= maxQty}
            onClick={() => handleQuantityChange(quantity + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-800 text-sm font-bold text-white transition hover:bg-slate-700 disabled:opacity-30"
          >
            +
          </button>
        </div>

        {/* Position info */}
        <div className="mb-3 rounded-lg border border-slate-700/30 bg-slate-950/40 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">В портфеле</span>
            <span className="font-semibold text-white">{row.qty} шт.</span>
          </div>
          {listing ? (
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">Текущая цена</span>
              <MoneyValue amount={currentPrice} size="sm" color="white" />
            </div>
          ) : null}
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-slate-400">Средняя цена</span>
            <MoneyValue amount={row.price} size="sm" color="white" />
          </div>
        </div>

        {/* Financial summary */}
        <div className="mb-4 space-y-1 px-1 text-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span>Выручка</span>
            <MoneyValue amount={gross} size="sm" color="white" />
          </div>
          <div className="flex items-center justify-between rounded-md bg-rose-500/8 px-2 py-1 -mx-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-300/90">
              Комиссия ({commissionPercent}%)
            </span>
            <MoneyValue amount={commissionAmount} size="sm" color="red" prefix="−" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Прибыль с продажи</span>
            <span
              className={`text-sm font-bold font-mono ${
                totalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {format_change(row.changePct)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-700/30 pt-1 font-medium text-white">
            <span>На баланс</span>
            <MoneyValue amount={net} size="lg" color="emerald" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <GameButton size="sm" variant="muted" className="flex-1" onClick={onClose} disabled={busy}>
            Отмена
          </GameButton>
          <GameButton
            size="sm"
            variant="danger"
            className="flex-1"
            disabled={busy || quantity < 1 || quantity > maxQty}
            onClick={async () => {
              await onConfirm(quantity);
              setQuantity(1);
            }}
          >
            {busy
              ? 'Продажа...'
              : `Продать ${quantity} шт. за ${formatMoney(net)}`}
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}
