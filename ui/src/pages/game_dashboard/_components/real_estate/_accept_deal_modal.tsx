import { useEffect, useMemo, useState } from 'react';
import type { AcceptPropertyOfferResponse } from '../../../../api/propertyOffers';
import { GameModal } from '../../../../components/game_ui/floating';
import { MoneyValue } from '../../../../components/money/money_value';
import { getRealEstateImage } from '../../../../constants/realEstateImages';
import { TrendArrowIcon } from '../../../../shared/icons';
import { useGameStore } from '../../../../stores/game.store';
import type { PropertyOffer } from '../../_model/types';
import {
  buildAcceptDealPreview,
  canAffordPurchase,
  getDefaultPurchasePaymentMode,
  type PropertyOfferPaymentMode,
} from './_accept_deal_utils';
import { AcceptDealPreviewView } from './_accept_deal_modal_preview';
import { ReputationChangeBlock } from './_reputation_change_block';
import { NegotiateDealSuccessFooter } from './_negotiate_outcome_view';
import './_accept_deal_modal.css';
import './_negotiate_modal.css';

type AcceptPhase = 'preview' | 'confirming' | 'success';

interface AcceptDealModalProps {
  open: boolean;
  offer: PropertyOffer;
  busy?: boolean;
  onClose: () => void;
  onConfirm: (
    offerId: string,
    paymentMode: PropertyOfferPaymentMode,
  ) => Promise<AcceptPropertyOfferResponse>;
}

function ProfitHighlight({ amount, isPurchase }: { amount: number; isPurchase: boolean }) {
  const profitable = amount >= 0;
  const label = isPurchase
    ? profitable
      ? 'Экономия'
      : 'Переплата'
    : profitable
      ? 'Прибыль'
      : 'Убыток';

  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        profitable
          ? 'border-emerald-500/25 bg-emerald-500/10'
          : 'border-rose-500/25 bg-rose-500/10'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <TrendArrowIcon up={profitable} className={`h-4 w-4 ${profitable ? 'text-emerald-400' : 'text-rose-400'}`} />
        <MoneyValue
          amount={Math.abs(amount)}
          size="lg"
          color={profitable ? 'emerald' : 'red'}
          prefix={profitable ? '+' : '−'}
        />
        <span className={`text-sm font-semibold ${profitable ? 'text-emerald-300/80' : 'text-rose-300/80'}`}>
          к рыночной цене
        </span>
      </div>
    </div>
  );
}

function InstallmentBreakdownBlock({
  breakdown,
}: {
  breakdown: NonNullable<ReturnType<typeof buildAcceptDealPreview>['installmentBreakdown']>;
}) {
  return (
    <div className="w-full rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-amber-300/90">
        Имущество в рассрочке
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-slate-900/40 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Выплачено</p>
          <MoneyValue amount={breakdown.paidTotal} size="sm" color="white" className="mt-1" />
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">Осталось</p>
          <MoneyValue amount={breakdown.remainingTotal} size="sm" color="white" className="mt-1" />
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
            На баланс
          </p>
          <MoneyValue
            amount={Math.abs(breakdown.netProfit)}
            size="sm"
            color={breakdown.netProfit >= 0 ? 'emerald' : 'red'}
            prefix={breakdown.netProfit >= 0 ? '+' : '−'}
            className="mt-1"
          />
        </div>
      </div>
      <p className="mt-3 text-center text-xs text-slate-400">
        Цена покупки:{' '}
        <MoneyValue amount={breakdown.purchasePrice} size="sm" color="white" className="inline-flex" />
        {' · '}разница с предложением:{' '}
        <MoneyValue
          amount={Math.abs(breakdown.priceDelta)}
          size="sm"
          color={breakdown.priceDelta >= 0 ? 'emerald' : 'red'}
          prefix={breakdown.priceDelta >= 0 ? '+' : '−'}
          className="inline-flex"
        />
      </p>
    </div>
  );
}

function AcceptSuccessView({
  outcome,
}: {
  outcome: AcceptPropertyOfferResponse;
}) {
  const deal = outcome.deal;
  const image = getRealEstateImage(deal.assetId);
  const isPurchase = deal.action === 'purchased';
  const balanceDelta = outcome.balance - outcome.previousBalance;
  const profitable = outcome.profitAmount >= 0;
  const displayAmount = Math.abs(balanceDelta) || outcome.deal.price;

  return (
    <div className="negotiate-modal-enter flex w-full flex-col items-center gap-5">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-400">Сделка закрыта</p>
          <h3 className="mt-2 text-2xl font-black text-white">
            {isPurchase ? 'Новое приобретение' : 'Успешная продажа'}
          </h3>
        </div>

        <article className="w-full overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-800/50">
          <div className="relative h-36 w-full overflow-hidden bg-slate-950/60">
            {image ? (
              <img src={image} alt={deal.itemName} className="h-full w-full object-contain p-4 opacity-90" />
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
                  amount={displayAmount}
                  size="lg"
                  color={isPurchase ? 'white' : 'emerald'}
                />
              </div>
              {balanceDelta !== 0 ? (
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Баланс</p>
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

        <ProfitHighlight amount={outcome.profitAmount} isPurchase={isPurchase} />

        {outcome.installmentBreakdown ? (
          <InstallmentBreakdownBlock breakdown={outcome.installmentBreakdown} />
        ) : null}

        <ReputationChangeBlock
          previousReputation={outcome.previousReputation}
          reputation={outcome.reputation}
          animate
          positive={profitable}
        />
      </div>
  );
}

export function AcceptDealModal({ open, offer, busy = false, onClose, onConfirm }: AcceptDealModalProps) {
  const reputation = useGameStore((state) => state.characterProfile.reputation);
  const balance = useGameStore((state) => state.balance);
  const inventoryItems = useGameStore((state) => state.inventoryItems);
  const [phase, setPhase] = useState<AcceptPhase>('preview');
  const [outcome, setOutcome] = useState<AcceptPropertyOfferResponse | null>(null);
  const [paymentMode, setPaymentMode] = useState<PropertyOfferPaymentMode>('installment');

  const preview = useMemo(
    () => buildAcceptDealPreview(offer, reputation, inventoryItems),
    [offer, reputation, inventoryItems],
  );

  const image = getRealEstateImage(offer.assetId);
  const controlsLocked = phase === 'confirming' || busy;
  const isPurchase = preview.isPurchase;
  const canConfirmPurchase = isPurchase
    ? canAffordPurchase(balance, offer.offerPrice, offer.downPaymentPercent, paymentMode)
    : true;

  useEffect(() => {
    if (!open) return;
    setPhase('preview');
    setOutcome(null);
    setPaymentMode(
      isPurchase
        ? getDefaultPurchasePaymentMode(balance, offer.offerPrice)
        : 'installment',
    );
  }, [balance, isPurchase, offer.downPaymentPercent, offer.id, offer.offerPrice, open]);

  const handleConfirm = async () => {
    if (controlsLocked || !canConfirmPurchase) return;
    setPhase('confirming');
    try {
      const result = await onConfirm(offer.id, isPurchase ? paymentMode : 'installment');
      setOutcome(result);
      setPhase('success');
    } catch {
      setPhase('preview');
    }
  };

  const handleClose = () => {
    if (phase === 'confirming') return;
    onClose();
  };

  return (
    <GameModal
      open={open}
      onClose={handleClose}
      labelledBy="accept-deal-title"
      overlayClassName="bg-slate-950/72 backdrop-blur-sm"
      panelClassName={[
        'property-sale-modal property-sale-modal-enter pointer-events-auto',
        isPurchase ? 'property-sale-modal--buy' : 'property-sale-modal--sell',
        phase === 'success' ? 'property-sale-modal--success' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {phase === 'success' && outcome ? (
        <>
          <div className="property-sale-modal__body-scroll">
            <AcceptSuccessView outcome={outcome} />
          </div>
          <NegotiateDealSuccessFooter onClose={handleClose} />
        </>
      ) : (
        <AcceptDealPreviewView
          offer={offer}
          preview={preview}
          reputation={reputation}
          image={image}
          balance={balance}
          paymentMode={paymentMode}
          onPaymentModeChange={setPaymentMode}
          confirming={phase === 'confirming'}
          controlsLocked={controlsLocked || !canConfirmPurchase}
          onClose={handleClose}
          onConfirm={() => void handleConfirm()}
        />
      )}
    </GameModal>
  );
}
