import { useMemo } from 'react';
import { GameModal } from '../../../../components/game_ui/floating';
import { GameButton } from '../../../../components/game_ui/game_button';
import type { PriceHistoryPoint, StockListing } from '../../../../api/stocks';
import { StockSparkline } from './_stock_sparkline';
import { getHistoryWindowMeta, getSparklineDisplayHistory, resolveListingHistory } from './_stock_sparkline_utils';
import { StockChangeBadge } from './_stock_change_badge';
import { gameAudio } from '../../../../lib/audio/game_audio';

export function StockChartModal({
  open,
  listing,
  history,
  onClose,
  onBuy,
}: {
  open: boolean;
  listing: StockListing | null;
  history: PriceHistoryPoint[];
  onClose: () => void;
  onBuy?: () => void;
}) {
  const turnUp = (listing?.dayChange ?? 0) >= 0;
  const chartHistory = useMemo(
    () => (listing ? resolveListingHistory(listing, history) : []),
    [listing, history],
  );
  const displayHistory = useMemo(() => getSparklineDisplayHistory(chartHistory), [chartHistory]);
  const periodMeta = useMemo(() => getHistoryWindowMeta(chartHistory), [chartHistory]);
  const locked = listing ? listing.isLocked || !listing.availableOnExchange : true;

  return (
    <GameModal
      open={open}
      onClose={onClose}
      labelledBy="stock-chart-title"
      panelClassName="w-full max-w-md"
    >
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/95 p-5 shadow-2xl">
        <h3 id="stock-chart-title" className="text-lg font-bold text-white">
          {listing?.ticker ?? '—'} · {listing?.name ?? 'График'}
        </h3>

        <div className="stock-card__change-group mt-2" aria-label="Изменение цены">
          <StockChangeBadge
            value={listing?.dayChange ?? null}
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

        <div className="mt-4 rounded-xl border border-slate-700/40 bg-slate-950/60 p-3">
          <StockSparkline history={displayHistory} up={turnUp} width={320} height={120} />
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <GameButton size="sm" variant="muted" onClick={onClose}>
            Закрыть
          </GameButton>
          {!locked && onBuy ? (
            <GameButton
              size="sm"
              variant="emerald"
              onClick={() => {
                gameAudio.playSfx('buttonClick');
                onBuy();
              }}
            >
              Купить
            </GameButton>
          ) : null}
        </div>
      </div>
    </GameModal>
  );
}
