import { useState } from 'react';
import { GameButton } from '../../../../components/game_ui/game_button';
import { MoneyValue } from '../../../../components/money/money_value';
import type { IpoListing } from '../../../../api/stocks';
import { format_turns_left_label } from '../../_model/utils';
import { ProfitGradeBadge } from '../real_estate/_profit_grade_badge';

export function IpoSection({
  ipos,
  currentTurn,
  busy,
  onSubscribe,
  embedded = false,
}: {
  ipos: IpoListing[];
  currentTurn: number;
  busy?: boolean;
  onSubscribe: (ipoId: string, amount: number) => Promise<void>;
  embedded?: boolean;
}) {
  const [amountByIpo, setAmountByIpo] = useState<Record<string, number>>({});

  if (ipos.length === 0) return null;

  return (
    <section className={embedded ? '' : 'mb-6'}>
      {!embedded ? (
        <h3 className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-amber-300/90">IPO</h3>
      ) : null}
      <div className="grid grid-cols-1 gap-4 min-[720px]:grid-cols-2">
        {ipos.map((ipo) => {
          const turnsLeft = Math.max(0, ipo.ipoAtTurn - currentTurn);
          const amount = amountByIpo[ipo.id] ?? ipo.minSubscription;

          return (
            <article
              key={ipo.id}
              className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-amber-200">{ipo.ticker}</p>
                  <p className="text-base font-semibold text-white">{ipo.companyName}</p>
                </div>
                <ProfitGradeBadge grade={ipo.targetGrade} embedded />
              </div>

              <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
                <span>Цена размещения</span>
                <MoneyValue amount={ipo.ipoPrice} size="sm" color="white" />
              </div>
              <p className="mt-2 text-xs text-amber-200/80">
                Закрытие подписки: {format_turns_left_label(turnsLeft)}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="number"
                  min={ipo.minSubscription}
                  max={ipo.maxSubscription}
                  value={amount}
                  onChange={(event) =>
                    setAmountByIpo((prev) => ({
                      ...prev,
                      [ipo.id]: Number(event.target.value),
                    }))
                  }
                  className="w-24 rounded-lg border border-slate-600/50 bg-slate-950/60 px-2 py-1.5 text-sm text-white"
                />
                <GameButton
                  size="sm"
                  disabled={busy}
                  onClick={() => onSubscribe(ipo.id, amount)}
                >
                  Подписаться
                </GameButton>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
