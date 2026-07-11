import { useMemo, useState } from 'react';
import { GameModal } from '../../../../components/game_ui/floating';
import { GameButton } from '../../../../components/game_ui/game_button';
import { MoneyValue } from '../../../../components/money/money_value';
import type { StockListing } from '../../../../api/stocks';
import { STOCK_GRADE_CONFIG } from './_stock_grade_config';

export function StockBuyModal({
  open,
  listing,
  balance,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  listing: StockListing | null;
  balance: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);

  const total = useMemo(() => {
    if (!listing) return 0;
    return listing.currentPrice * quantity;
  }, [listing, quantity]);

  const canAfford = total <= balance;
  const gradeConfig = listing ? STOCK_GRADE_CONFIG[listing.grade] : null;

  if (!listing) return null;

  return (
    <GameModal open={open} onClose={onClose} labelledBy="stock-buy-title" panelClassName="w-full max-w-md">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/95 p-5 shadow-2xl">
        <h3 id="stock-buy-title" className="text-lg font-bold text-white">
          Покупка {listing.ticker}
        </h3>
        <p className="mt-1 text-sm text-slate-400">{listing.name}</p>

        {listing.isLocked && gradeConfig ? (
          <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Требуется банковский уровень {gradeConfig.minBankingLevel}
            {gradeConfig.minReputation > 0 ? ` и репутация ${gradeConfig.minReputation}` : ''}.
          </p>
        ) : null}

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-950/50 px-4 py-3">
          <span className="text-sm text-slate-400">Количество</span>
          <div className="flex items-center gap-2">
            <GameButton
              size="sm"
              variant="muted"
              disabled={quantity <= 1 || busy}
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            >
              −
            </GameButton>
            <span className="min-w-[2rem] text-center font-mono text-lg font-bold text-white">{quantity}</span>
            <GameButton
              size="sm"
              variant="muted"
              disabled={busy}
              onClick={() => setQuantity((value) => value + 1)}
            >
              +
            </GameButton>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between px-1">
          <span className="text-sm text-slate-400">Итого</span>
          <MoneyValue amount={total} size="lg" color={canAfford ? 'white' : 'red'} />
        </div>

        {!canAfford ? (
          <p className="mt-2 text-sm text-rose-400">Недостаточно средств на балансе</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <GameButton size="sm" variant="muted" onClick={onClose} disabled={busy}>
            Отмена
          </GameButton>
          <GameButton
            size="sm"
            disabled={busy || listing.isLocked || !canAfford}
            onClick={async () => {
              await onConfirm(quantity);
              setQuantity(1);
            }}
          >
            Купить
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}
