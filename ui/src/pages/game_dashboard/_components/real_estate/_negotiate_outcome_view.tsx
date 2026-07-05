import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MoneyValue } from '../../../../components/money/money_value';
import { GameButton } from '../../../../components/game_ui/game_button';
import { AssetImageFrame } from '../../../../shared/components';
import { gameAudio } from '../../../../lib/audio/game_audio';
import type { AcceptPropertyOfferResponse } from '../../../../api/propertyOffers';
import type { NegotiatePropertyOfferResponse } from '../../../../api/propertyOffers';
import type { PropertyOffer } from '../../_model/types';
import { calcDownPaymentAmount, calcInstallmentSaleBreakdown, calcSaleBalanceCredit, canAffordPurchase, getDefaultPurchasePaymentMode, type PropertyOfferPaymentMode } from './_accept_deal_utils';
import { PropertyPaymentModePicker } from './_property_payment_mode';
import { ReputationChangeBlock } from './_reputation_change_block';
import { SaleBalanceBreakdown } from './_sale_balance_breakdown';
import { useGameStore } from '../../../../stores/game.store';

interface NegotiatePendingAcceptViewProps {
  offer: PropertyOffer;
  outcome: NegotiatePropertyOfferResponse;
  isPurchase: boolean;
  balance: number;
  busy?: boolean;
  acceptError?: string | null;
  onAccept: (paymentMode: PropertyOfferPaymentMode) => void;
  onDecline: () => void;
}

export function NegotiatePendingAcceptView({
  offer,
  outcome,
  isPurchase,
  balance,
  busy = false,
  acceptError = null,
  onAccept,
  onDecline,
}: NegotiatePendingAcceptViewProps) {
  const inventoryItems = useGameStore((state) => state.inventoryItems);
  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent);
  const negotiatedPrice = outcome.negotiatedPrice ?? offer.pendingNegotiatedPrice ?? offer.offerPrice;
  const [paymentMode, setPaymentMode] = useState<PropertyOfferPaymentMode>('installment');

  useEffect(() => {
    if (!isPurchase) return;
    setPaymentMode(
      getDefaultPurchasePaymentMode(balance, negotiatedPrice),
    );
  }, [balance, isPurchase, negotiatedPrice, offer.downPaymentPercent]);

  const downPaymentAmount = isPurchase
    ? calcDownPaymentAmount(negotiatedPrice, offer.downPaymentPercent)
    : null;
  const ownedItem = useMemo(
    () =>
      !isPurchase && offer.inventoryItemId
        ? inventoryItems.find((item) => item.id === offer.inventoryItemId)
        : undefined,
    [inventoryItems, isPurchase, offer.inventoryItemId],
  );
  const saleBalanceCredit = !isPurchase
    ? calcSaleBalanceCredit(ownedItem, negotiatedPrice)
    : null;
  const installmentBreakdown =
    !isPurchase && ownedItem
      ? calcInstallmentSaleBreakdown(ownedItem, negotiatedPrice)
      : null;
  const canConfirm = isPurchase
    ? canAffordPurchase(balance, negotiatedPrice, offer.downPaymentPercent, paymentMode)
    : true;
  const hasRollDetails = outcome.d20 > 0;
  const payNowAmount = isPurchase
    ? paymentMode === 'full'
      ? negotiatedPrice
      : downPaymentAmount
    : saleBalanceCredit;
  const panelRef = useRef<HTMLElement>(null);
  const [visualSize, setVisualSize] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const updateSize = () => {
      const nextSize = panel.offsetHeight;
      setVisualSize((current) => (current === nextSize ? current : nextSize));
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(panel);
    window.addEventListener('resize', updateSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [
    acceptError,
    canConfirm,
    installmentBreakdown,
    isPurchase,
    negotiatedPrice,
    offer.id,
    paymentMode,
  ]);

  return (
    <div className="negotiate-outcome negotiate-outcome--pending">
      <header className="negotiate-outcome__header">
        <div className="negotiate-outcome__headline">
          <p className="negotiate-outcome__eyebrow">Торг удался</p>
          <h3 id="negotiate-outcome-title" className="negotiate-outcome__title">
            {isPurchase ? 'Продавец согласился' : 'Покупатель согласился'}
          </h3>
          <p className="negotiate-outcome__subtitle">
            Подтвердите сделку — списание произойдёт только после принятия
          </p>
        </div>

        {hasRollDetails ? (
          <div className="negotiate-outcome__roll-chip" aria-label="Результат броска">
            <span>
              D20 <strong>{outcome.d20}</strong>
            </span>
            <span className="negotiate-outcome__roll-chip-sep" aria-hidden>
              ·
            </span>
            <span>
              итого <strong className="negotiate-outcome__roll-chip-success">{outcome.roll}</strong>
            </span>
            <span className="negotiate-outcome__roll-chip-sep" aria-hidden>
              ·
            </span>
            <span>
              цель <strong>{outcome.target}+</strong>
            </span>
          </div>
        ) : null}
      </header>

      <div className="negotiate-outcome__body">
        <aside
          className="negotiate-outcome__visual"
          aria-label={offer.itemName}
          style={
            visualSize
              ? { width: visualSize, height: visualSize, flexShrink: 0 }
              : undefined
          }
        >
          <div className="negotiate-outcome__visual-media">
            <AssetImageFrame
              assetId={offer.assetId}
              alt={offer.itemName}
              size="fill"
              decorations={false}
              fallback={<div className="negotiate-outcome__visual-placeholder" aria-hidden>🏠</div>}
            >
              <div className="negotiate-outcome__visual-overlay">
                <span className="negotiate-outcome__visual-name">{offer.itemName}</span>
                <span className="negotiate-outcome__visual-grade">Категория {offer.profitGrade}</span>
              </div>
            </AssetImageFrame>
          </div>
        </aside>

        <section
          ref={panelRef}
          className="negotiate-outcome__panel"
          aria-label="Условия сделки"
        >
          <div
            className={[
              'negotiate-outcome__metrics',
              installmentBreakdown ? 'negotiate-outcome__metrics--stacked' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <div className="negotiate-outcome__metric negotiate-outcome__metric--primary">
              <span className="negotiate-outcome__metric-label">
                {isPurchase ? 'Согласованная цена' : 'Согласованная выручка'}
              </span>
              <MoneyValue amount={negotiatedPrice} size="lg" color="emerald" />
            </div>

            {payNowAmount !== null ? (
              <div
                className={[
                  'negotiate-outcome__metric',
                  'negotiate-outcome__metric--pay-now',
                  installmentBreakdown ? 'negotiate-outcome__metric--balance-detail' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="negotiate-outcome__metric-label negotiate-outcome__metric-label--pay-now">
                  {isPurchase ? 'К оплате сейчас' : 'На баланс'}
                </span>
                <MoneyValue
                  amount={payNowAmount}
                  size={installmentBreakdown ? 'lg' : 'md'}
                  color={!canConfirm ? 'red' : isPurchase ? 'amber' : 'emerald'}
                />
                {installmentBreakdown ? (
                  <SaleBalanceBreakdown breakdown={installmentBreakdown} />
                ) : null}
              </div>
            ) : null}
          </div>

          {isPurchase ? (
            <div className="negotiate-outcome__payment">
              <PropertyPaymentModePicker
                assetId={offer.assetId}
                price={negotiatedPrice}
                downPaymentPercent={offer.downPaymentPercent}
                interestRatePercent={bankBaseRatePercent}
                balance={balance}
                mode={paymentMode}
                onChange={setPaymentMode}
              />
            </div>
          ) : null}

          {acceptError ? (
            <p className="negotiate-outcome__alert negotiate-outcome__alert--error" role="alert">
              {acceptError}
            </p>
          ) : null}

          {!canConfirm ? (
            <p className="negotiate-outcome__alert negotiate-outcome__alert--warning" role="status">
              {paymentMode === 'full'
                ? 'Недостаточно средств для полной оплаты'
                : 'Недостаточно средств для взноса'}
            </p>
          ) : null}
        </section>
      </div>

      <footer className="trade-modal__footer">
        <GameButton
          variant="muted"
          size="sm"
          fullWidth
          disabled={busy}
          onClick={onDecline}
          className="trade-modal__footer-btn trade-modal__footer-btn--cancel"
        >
          Отказаться
        </GameButton>
        <GameButton
          variant="emerald"
          size="sm"
          fullWidth
          disabled={busy || !canConfirm}
          onClick={() => {
            gameAudio.playSfx('buttonClick');
            onAccept(paymentMode);
          }}
          className="trade-modal__footer-btn trade-modal__confirm-btn"
        >
          Принять сделку
        </GameButton>
      </footer>
    </div>
  );
}

interface NegotiateDealSuccessViewProps {
  result: AcceptPropertyOfferResponse;
  rollOutcome?: NegotiatePropertyOfferResponse | null;
  onClose?: () => void;
}

export function NegotiateDealSuccessView({
  result,
  rollOutcome = null,
}: NegotiateDealSuccessViewProps) {
  const deal = result.deal;
  const isPurchase = deal.action === 'purchased';
  const balanceDelta = result.balance - result.previousBalance;
  const displayAmount = Math.abs(balanceDelta) || result.deal.price;

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
          <AssetImageFrame
            assetId={deal.assetId}
            alt={deal.itemName}
            size="fill"
            decorations={false}
            imageClassName="opacity-90"
          />
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

      {rollOutcome && rollOutcome.d20 > 0 ? (
        <div className="w-full rounded-xl border border-white/5 bg-slate-800/40 px-4 py-3 text-center text-sm text-slate-300">
          Бросок: <span className="font-bold text-white">{rollOutcome.d20}</span> + репутация ={' '}
          <span className="font-bold text-emerald-400">{rollOutcome.roll}</span>
          {' · '}
          цель <span className="font-bold text-white">{rollOutcome.target}+</span>
        </div>
      ) : null}

      <ReputationChangeBlock
        previousReputation={result.previousReputation}
        reputation={result.reputation}
        animate
        positive
      />
    </div>
  );
}

interface NegotiateFailureViewProps {
  outcome: NegotiatePropertyOfferResponse;
}

export function NegotiateFailureView({ outcome }: NegotiateFailureViewProps) {
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

      <div className="w-full rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-4 text-center">
        <p className="text-sm text-slate-300">
          Предложение остаётся на рынке — можно попробовать снова
        </p>
      </div>

      <ReputationChangeBlock
        previousReputation={outcome.previousReputation}
        reputation={outcome.reputation}
        animate
        positive={false}
      />
    </div>
  );
}

export function NegotiateDealSuccessFooter({ onClose }: { onClose: () => void }) {
  return (
    <footer className="trade-modal__footer trade-modal__footer--single">
      <GameButton
        variant="action"
        size="sm"
        fullWidth
        onClick={onClose}
        className="trade-modal__footer-btn trade-modal__footer-btn--action"
      >
        Отлично
      </GameButton>
    </footer>
  );
}

export function NegotiateFailureFooter({
  onRetry,
  onClose,
}: {
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <footer className="trade-modal__footer">
      <GameButton
        variant="muted"
        size="sm"
        fullWidth
        onClick={onClose}
        className="trade-modal__footer-btn trade-modal__footer-btn--cancel"
      >
        Закрыть
      </GameButton>
      <GameButton
        variant="emerald"
        size="sm"
        fullWidth
        onClick={onRetry}
        className="trade-modal__footer-btn trade-modal__confirm-btn"
      >
        Попробовать снова
      </GameButton>
    </footer>
  );
}
