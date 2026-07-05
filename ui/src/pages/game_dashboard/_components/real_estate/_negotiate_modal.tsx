import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AcceptPropertyOfferResponse } from '../../../../api/propertyOffers';
import type { NegotiatePropertyOfferResponse, PropertyOfferPaymentMode } from '../../../../api/propertyOffers';
import { getApiErrorMessage } from '../../../../api/auth';
import { GameModal } from '../../../../components/game_ui/floating';
import { gameAudio } from '../../../../lib/audio/game_audio';
import { useGameStore } from '../../../../stores/game.store';
import type { PropertyOffer } from '../../_model/types';
import { NegotiateDiceRollView, DICE_SPIN_MIN_MS, SETTLE_ANIMATION_MS } from './_negotiate_dice_roll_view';
import {
  NegotiateDealSuccessView,
  NegotiateDealSuccessFooter,
  NegotiateFailureFooter,
  NegotiateFailureView,
  NegotiatePendingAcceptView,
} from './_negotiate_outcome_view';
import { NegotiatePreviewView } from './_negotiate_modal_preview';
import {
  calcPurchaseNegotiateSuccessChance,
  calcPurchaseNegotiateTarget,
  calcPurchaseProposedPrice,
  calcSellMarkupProposedPrice,
  clampPurchaseDiscountPercent,
  discountPercentToAdjustment,
  getMaxNegotiateDiscountPercent,
  isPurchaseNegotiation,
  NEGOTIATE_PURCHASE_DISCOUNT_MIN,
  snapPurchaseDiscountPercent,
} from './_negotiate_utils';
import './_negotiate_modal.css';

type NegotiatePhase = 'negotiate' | 'rolling' | 'pending' | 'confirmed' | 'failure';

const DICE_REVEAL_MS = SETTLE_ANIMATION_MS;

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

interface NegotiateModalProps {
  open: boolean;
  offer: PropertyOffer;
  busy?: boolean;
  onClose: () => void;
  onRoll: (adjustmentPercent: number) => Promise<NegotiatePropertyOfferResponse>;
  onAcceptNegotiated: (
    offerId: string,
    paymentMode: PropertyOfferPaymentMode,
  ) => Promise<AcceptPropertyOfferResponse>;
  onDeclineNegotiated: (offerId: string) => Promise<void>;
}

export function NegotiateModal({
  open,
  offer,
  busy = false,
  onClose,
  onRoll,
  onAcceptNegotiated,
  onDeclineNegotiated,
}: NegotiateModalProps) {
  const reputation = useGameStore((state) => state.characterProfile.reputation);
  const balance = useGameStore((state) => state.balance);
  const tradingLevel = useGameStore((state) => state.characterProfile.tradingLevel) || 1;
  const maxDiscountPercent = useMemo(
    () => getMaxNegotiateDiscountPercent(tradingLevel),
    [tradingLevel],
  );

  const isPurchase = isPurchaseNegotiation(offer.type);
  const [negotiatePercent, setNegotiatePercent] = useState(NEGOTIATE_PURCHASE_DISCOUNT_MIN);
  const [phase, setPhase] = useState<NegotiatePhase>('negotiate');
  const [rollOutcome, setRollOutcome] = useState<NegotiatePropertyOfferResponse | null>(null);
  const [acceptResult, setAcceptResult] = useState<AcceptPropertyOfferResponse | null>(null);
  const [revealedD20, setRevealedD20] = useState<number | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [rollSession, setRollSession] = useState(0);

  const clampedPercent = useMemo(
    () => clampPurchaseDiscountPercent(negotiatePercent, maxDiscountPercent),
    [maxDiscountPercent, negotiatePercent],
  );

  const adjustmentPercent = useMemo(() => {
    const normalized = discountPercentToAdjustment(clampedPercent, maxDiscountPercent);
    return Number.isFinite(normalized)
      ? normalized
      : NEGOTIATE_PURCHASE_DISCOUNT_MIN;
  }, [clampedPercent, maxDiscountPercent]);

  const resetState = useCallback(() => {
    setNegotiatePercent(NEGOTIATE_PURCHASE_DISCOUNT_MIN);
    setPhase('negotiate');
    setRollOutcome(null);
    setAcceptResult(null);
    setRevealedD20(null);
    setSubmitError(null);
    setAcceptError(null);
  }, []);

  useEffect(() => {
    if (!open) return;

    if (offer.pendingNegotiatedPrice != null) {
      setPhase('pending');
      setRollOutcome({
        success: true,
        d20: 0,
        roll: 0,
        target: 0,
        negotiatedPrice: offer.pendingNegotiatedPrice,
        deal: null,
        previousReputation: reputation,
        reputation,
        previousBalance: balance,
        balance,
        propertyOffers: [],
        character: {} as NegotiatePropertyOfferResponse['character'],
        news: null,
      });
      setAcceptResult(null);
      setRevealedD20(null);
      setSubmitError(null);
      setAcceptError(null);
      return;
    }

    resetState();
    // Только при открытии модалки / смене оффера.
    // Не реагируем на pendingNegotiatedPrice после API — иначе бросок прерывается.
  }, [open, offer.id, resetState]);

  useEffect(() => {
    setNegotiatePercent((current) => snapPurchaseDiscountPercent(current, maxDiscountPercent));
  }, [maxDiscountPercent]);

  const target = useMemo(
    () => calcPurchaseNegotiateTarget(clampedPercent),
    [clampedPercent],
  );
  const successChance = useMemo(
    () => calcPurchaseNegotiateSuccessChance(clampedPercent, reputation),
    [clampedPercent, reputation],
  );
  const proposedPrice = useMemo(() => {
    if (isPurchase) {
      return calcPurchaseProposedPrice(offer.offerPrice, clampedPercent, maxDiscountPercent);
    }
    return calcSellMarkupProposedPrice(offer.offerPrice, clampedPercent, maxDiscountPercent);
  }, [clampedPercent, isPurchase, maxDiscountPercent, offer.offerPrice]);

  const controlsLocked = phase !== 'negotiate' || busy;
  const repBonus = Math.floor(reputation);

  const runRoll = useCallback(async () => {
    try {
      const outcome = await Promise.all([
        onRoll(adjustmentPercent),
        wait(DICE_SPIN_MIN_MS),
      ]).then(([result]) => result);

      setRollOutcome(outcome);
      setRevealedD20(outcome.d20);
      await wait(DICE_REVEAL_MS);

      if (outcome.success) {
        gameAudio.playSfx('dealSuccess');
        setPhase('pending');
      } else {
        gameAudio.playSfx('dealFail');
        setPhase('failure');
      }
    } catch (error) {
      const message = await getApiErrorMessage(
        error,
        'Не удалось отправить предложение. Попробуйте ещё раз.',
      );
      setPhase('negotiate');
      setRollOutcome(null);
      setRevealedD20(null);
      setSubmitError(message);
    }
  }, [adjustmentPercent, onRoll]);

  const handleConfirm = () => {
    if (phase !== 'negotiate' || successChance === 0) return;

    setSubmitError(null);
    setRollOutcome(null);
    setRevealedD20(null);
    setRollSession((value) => value + 1);
    setPhase('rolling');
    void runRoll();
  };

  const handleClose = () => {
    if (phase === 'rolling') return;
    onClose();
  };

  const handleRetry = () => {
    setRollOutcome(null);
    setRevealedD20(null);
    setSubmitError(null);
    setAcceptError(null);
    setPhase('negotiate');
  };

  const handleAcceptNegotiated = async (paymentMode: PropertyOfferPaymentMode) => {
    setAcceptError(null);
    try {
      const result = await onAcceptNegotiated(offer.id, paymentMode);
      setAcceptResult(result);
      setPhase('confirmed');
    } catch (error) {
      const message = await getApiErrorMessage(
        error,
        'Не удалось принять сделку. Попробуйте ещё раз.',
      );
      setAcceptError(message);
    }
  };

  const handleDeclineNegotiated = async () => {
    try {
      await onDeclineNegotiated(offer.id);
    } finally {
      onClose();
    }
  };

  const handlePercentChange = useCallback(
    (value: number) => {
      setSubmitError(null);
      setNegotiatePercent(clampPurchaseDiscountPercent(value, maxDiscountPercent));
    },
    [maxDiscountPercent],
  );

  const panelClassName = [
    'trade-modal trade-modal-enter pointer-events-auto',
    phase === 'negotiate' ? '' : 'trade-modal--outcome',
    phase === 'pending' ? 'trade-modal--outcome-pending' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <GameModal
      open={open}
      onClose={handleClose}
      labelledBy={phase === 'pending' ? 'negotiate-outcome-title' : 'negotiate-title'}
      overlayClassName="bg-slate-950/72 backdrop-blur-sm"
      panelClassName={panelClassName}
    >
      {phase === 'rolling' ? (
        <div className="trade-modal__body-scroll trade-modal__body-scroll--dice">
          <NegotiateDiceRollView
            key={rollSession}
            finalD20={revealedD20}
            reputationBonus={repBonus}
            target={rollOutcome?.target ?? target}
          />
        </div>
      ) : null}

      {phase === 'pending' && rollOutcome ? (
        <div className="trade-modal__body-scroll">
          <NegotiatePendingAcceptView
            offer={offer}
            outcome={rollOutcome}
            isPurchase={isPurchase}
            balance={balance}
            busy={busy}
            acceptError={acceptError}
            onAccept={(paymentMode) => void handleAcceptNegotiated(paymentMode)}
            onDecline={() => void handleDeclineNegotiated()}
          />
        </div>
      ) : null}

      {phase === 'confirmed' && acceptResult ? (
        <>
          <div className="trade-modal__body-scroll">
            <NegotiateDealSuccessView
              result={acceptResult}
              rollOutcome={rollOutcome}
            />
          </div>
          <NegotiateDealSuccessFooter onClose={handleClose} />
        </>
      ) : null}

      {phase === 'failure' && rollOutcome ? (
        <>
          <div className="trade-modal__body-scroll">
            <NegotiateFailureView outcome={rollOutcome} />
          </div>
          <NegotiateFailureFooter onRetry={handleRetry} onClose={handleClose} />
        </>
      ) : null}

      {phase === 'negotiate' ? (
        <NegotiatePreviewView
          offer={offer}
          isPurchase={isPurchase}
          negotiatePercent={clampedPercent}
          maxPercent={maxDiscountPercent}
          proposedPrice={proposedPrice}
          successChance={successChance}
          reputation={reputation}
          balance={balance}
          controlsLocked={controlsLocked}
          submitError={submitError}
          onPercentChange={handlePercentChange}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      ) : null}
    </GameModal>
  );
}
