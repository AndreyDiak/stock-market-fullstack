import { useMemo, useState } from 'react';
import { GameModal } from '../../../../components/game_ui/floating';
import { GameButton } from '../../../../components/game_ui/game_button';
import { MoneyValue } from '../../../../components/money/money_value';
import type { PortfolioRow } from '../../../../api/stocks';

export function StockSellModal({
  open,
  row,
  commissionPercent,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean;
  row: PortfolioRow | null;
  commissionPercent: number;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(1);

  const gross = useMemo(() => {
    if (!row) return 0;
    return row.price * quantity;
  }, [row, quantity]);

  const commissionAmount = useMemo(
    () => Number((gross * (commissionPercent / 100)).toFixed(2)),
    [gross, commissionPercent],
  );

  const net = useMemo(() => Number((gross - commissionAmount).toFixed(2)), [gross, commissionAmount]);

  if (!row) return null;

  const maxQty = row.qty;

  return (
    <GameModal open={open} onClose={onClose} labelledBy="stock-sell-title" panelClassName="w-full max-w-md">
      <div className="rounded-2xl border border-slate-700/50 bg-slate-900/95 p-5 shadow-2xl">
        <h3 id="stock-sell-title" className="text-lg font-bold text-white">
          Продажа {row.ticker}
        </h3>
        <p className="mt-1 text-sm text-slate-400">{row.name}</p>

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
              disabled={busy || quantity >= maxQty}
              onClick={() => setQuantity((value) => Math.min(maxQty, value + 1))}
            >
              +
            </GameButton>
            <GameButton
              size="sm"
              variant="muted"
              disabled={busy}
              onClick={() => setQuantity(maxQty)}
            >
              Все
            </GameButton>
          </div>
        </div>

        <div className="mt-3 space-y-1 px-1 text-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span>Выручка</span>
            <MoneyValue amount={gross} size="sm" color="white" />
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Комиссия ({commissionPercent}%)</span>
            <MoneyValue amount={commissionAmount} size="sm" color="red" prefix="−" />
          </div>
          <div className="flex items-center justify-between font-medium text-white">
            <span>На баланс</span>
            <MoneyValue amount={net} size="lg" color="emerald" />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <GameButton size="sm" variant="muted" onClick={onClose} disabled={busy}>
            Отмена
          </GameButton>
          <GameButton
            size="sm"
            disabled={busy}
            onClick={async () => {
              await onConfirm(quantity);
              setQuantity(1);
            }}
          >
            Продать
          </GameButton>
        </div>
      </div>
    </GameModal>
  );
}
