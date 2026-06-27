import { MoneyValue } from '../../../../components/money/money_value';
import { getRealEstateImage } from '../../../../constants/realEstateImages';
import { TrendArrowIcon } from '../../../../shared/icons';
import type { NegotiatePropertyOfferResponse } from '../../../../api/propertyOffers';
import { ReputationChangeBlock } from './_reputation_change_block';

interface NegotiateSuccessViewProps {
  outcome: NegotiatePropertyOfferResponse;
  onClose: () => void;
}

export function NegotiateSuccessView({ outcome, onClose }: NegotiateSuccessViewProps) {
  const deal = outcome.deal;
  if (!deal) return null;

  const image = getRealEstateImage(deal.assetId);
  const isPurchase = deal.action === 'purchased';
  const balanceDelta = outcome.balance - outcome.previousBalance;

  return (
    <div className="negotiate-modal-enter flex w-full flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">
          Сделка закрыта
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">
          {isPurchase ? 'Новое приобретение' : 'Успешная продажа'}
        </h3>
      </div>

      <article className="w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-800/50">
        <div className="relative h-36 w-full overflow-hidden bg-slate-950/60">
          {image ? (
            <img
              src={image}
              alt={deal.itemName}
              className="h-full w-full object-cover opacity-90"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent" />
          <span className="absolute bottom-3 left-3 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-200">
            {isPurchase ? 'Куплено' : 'Продано'}
          </span>
        </div>

        <div className="space-y-3 p-4">
          <h4 className="text-lg font-bold text-white">{deal.itemName}</h4>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {isPurchase ? 'Оплачено' : 'Получено'}
              </p>
              <MoneyValue
                amount={deal.price}
                size="lg"
                color={isPurchase ? 'white' : 'emerald'}
              />
            </div>
            {balanceDelta !== 0 ? (
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Баланс
                </p>
                <MoneyValue
                  amount={Math.abs(balanceDelta)}
                  size="md"
                  color={balanceDelta > 0 ? 'emerald' : 'red'}
                  prefix={balanceDelta > 0 ? '+' : '−'}
                />
              </div>
            ) : null}
          </div>
        </div>
      </article>

      <div className="w-full rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-center text-sm text-slate-300">
        Бросок: <span className="font-bold text-white">{outcome.d20}</span> + репутация ={' '}
        <span className="font-bold text-emerald-400">{outcome.roll}</span>
        {' · '}
        цель <span className="font-bold text-white">{outcome.target}+</span>
      </div>

      <ReputationChangeBlock
        previousReputation={outcome.previousReputation}
        reputation={outcome.reputation}
        animate
        positive
      />

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 py-3 text-sm font-black uppercase tracking-[0.14em] text-amber-950 shadow-[0_0_20px_rgba(234,179,8,0.3)] transition hover:shadow-[0_0_28px_rgba(234,179,8,0.45)]"
      >
        Отлично
      </button>
    </div>
  );
}

interface NegotiateFailureViewProps {
  outcome: NegotiatePropertyOfferResponse;
  onClose: () => void;
}

export function NegotiateFailureView({ outcome, onClose }: NegotiateFailureViewProps) {
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-500">
          Торговля сорвалась
        </p>
        <h3 className="mt-2 text-2xl font-black text-white">Неудачный бросок</h3>
        <p className="mt-2 text-sm text-slate-400">
          Выпало {outcome.d20} + репутация = {outcome.roll}, нужно было {outcome.target}+
        </p>
      </div>

      <div className="w-full rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-4 text-center">
        <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-rose-400">
          <TrendArrowIcon up={false} className="h-3 w-3" />
          Предложение снято с рынка
        </p>
      </div>

      <ReputationChangeBlock
        previousReputation={outcome.previousReputation}
        reputation={outcome.reputation}
        animate
        positive={false}
      />

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-600"
      >
        Закрыть
      </button>
    </div>
  );
}
