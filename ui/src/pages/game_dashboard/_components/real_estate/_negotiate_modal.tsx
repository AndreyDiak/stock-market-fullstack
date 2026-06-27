import Dice3D, { SETTLE_SECS } from 'react-3d-dice';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { NegotiatePropertyOfferResponse } from '../../../../api/propertyOffers';
import { GameModal } from '../../../../components/game_ui/floating';
import { MoneyValue } from '../../../../components/money/money_value';
import { TrendArrowIcon } from '../../../../shared/icons';
import { useGameStore } from '../../../../stores/game.store';
import type { PropertyOffer } from '../../_model/types';
import { NegotiateFailureView, NegotiateSuccessView } from './_negotiate_outcome_view';
import {
  calcNegotiateSuccessChance,
  calcNegotiateTarget,
  calcProposedPrice,
  getDiceColorForSuccessChance,
  getNegotiateRiskTier,
  getRiskTierGlowRgb,
  getRiskTierTextClass,
  NEGOTIATE_MAX_ADJUSTMENT,
  NEGOTIATE_MIN_ADJUSTMENT,
} from './_negotiate_utils';

const DICE_SETTLE_MS = Math.round(SETTLE_SECS * 1000) + 120;
/** react-3d-dice не рисует меш при results=[] — нужен placeholder для превью */
const IDLE_DICE_FACE = 20;

type NegotiatePhase = 'negotiate' | 'settling' | 'success' | 'failure';

interface NegotiateModalProps {
  open: boolean;
  offer: PropertyOffer;
  busy?: boolean;
  onClose: () => void;
  onRoll: (adjustmentPercent: number) => Promise<NegotiatePropertyOfferResponse>;
}

export function NegotiateModal({ open, offer, busy = false, onClose, onRoll }: NegotiateModalProps) {
  const reputation = useGameStore((state) => state.characterProfile.reputation);
  const [adjustment, setAdjustment] = useState(NEGOTIATE_MIN_ADJUSTMENT);
  const [phase, setPhase] = useState<NegotiatePhase>('negotiate');
  const [diceResults, setDiceResults] = useState<number[]>([IDLE_DICE_FACE]);
  const [isRolling, setIsRolling] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);
  const [rollOutcome, setRollOutcome] = useState<NegotiatePropertyOfferResponse | null>(null);

  const resetState = useCallback(() => {
    setAdjustment(NEGOTIATE_MIN_ADJUSTMENT);
    setPhase('negotiate');
    setDiceResults([IDLE_DICE_FACE]);
    setIsRolling(false);
    setRollOutcome(null);
    setRollTrigger(0);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetState();
  }, [open, offer.id, resetState]);

  const target = useMemo(() => calcNegotiateTarget(adjustment), [adjustment]);
  const successChance = useMemo(
    () => calcNegotiateSuccessChance(adjustment, reputation),
    [adjustment, reputation],
  );
  const proposedPrice = useMemo(
    () => calcProposedPrice(offer.type, offer.offerPrice, adjustment),
    [offer.type, offer.offerPrice, adjustment],
  );

  const riskTier = useMemo(() => getNegotiateRiskTier(successChance), [successChance]);
  const riskTextClass = getRiskTierTextClass(riskTier);
  const diceColor = useMemo(() => getDiceColorForSuccessChance(successChance), [successChance]);
  const glowRgb = getRiskTierGlowRgb(riskTier);
  const controlsLocked = phase !== 'negotiate' || isRolling || busy;

  const handleRoll = async () => {
    if (controlsLocked) return;

    setRollOutcome(null);
    setIsRolling(true);
    setPhase('settling');
    setRollTrigger((value) => value + 1);

    try {
      const outcome = await onRoll(adjustment);
      setDiceResults([outcome.d20]);
      setRollOutcome(outcome);
      setIsRolling(false);

      window.setTimeout(() => {
        setPhase(outcome.success ? 'success' : 'failure');
      }, DICE_SETTLE_MS);
    } catch {
      resetState();
    }
  };

  const handleClose = () => {
    if (phase === 'settling') return;
    onClose();
  };

  const showNegotiateUi = phase === 'negotiate' || phase === 'settling';

  return (
    <GameModal
      open={open}
      onClose={handleClose}
      labelledBy="negotiate-title"
      overlayClassName="bg-black/80 backdrop-blur-sm"
      panelClassName="negotiate-modal-enter pointer-events-auto relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700/30 bg-slate-900 p-6 shadow-2xl shadow-black/70 outline-none sm:p-8"
    >
      <div className="relative flex flex-col items-center gap-6">
        {phase === 'success' && rollOutcome ? (
          <NegotiateSuccessView outcome={rollOutcome} onClose={handleClose} />
        ) : null}

        {phase === 'failure' && rollOutcome ? (
          <NegotiateFailureView outcome={rollOutcome} onClose={handleClose} />
        ) : null}

        {showNegotiateUi ? (
          <>
            <header className="w-full text-center">
              <h2 id="negotiate-title" className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                Торговля: {offer.itemName}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-400">
                Двигай ползунок, чтобы выбрать наценку. Чем выше наценка, тем сложнее бросить кубик
                (D20 + Репутация).
              </p>
            </header>

            <section className="w-full rounded-2xl border border-white/5 bg-slate-800/40 p-6">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                Цель броска
              </p>
              <p className="mt-2 text-center text-4xl font-bold text-white">
                D20: <span className="text-emerald-400">{target}+</span>
              </p>

              <div
                id="negotiate-dice-slot"
                className="relative mx-auto mt-4 flex h-52 w-full max-w-[300px] items-center justify-center sm:h-56"
                aria-label="Область броска кубика"
              >
                <div
                  className="pointer-events-none absolute inset-0 rounded-full transition-[background,box-shadow] duration-300"
                  style={{
                    background: `radial-gradient(circle, rgba(${glowRgb}, 0.2) 0%, rgba(${glowRgb}, 0.06) 42%, transparent 72%)`,
                    boxShadow: `0 0 48px rgba(${glowRgb}, 0.18)`,
                  }}
                />

                <div className="relative z-10 h-[220px] w-full min-h-[220px]">
                  <Dice3D
                    sides={20}
                    color={diceColor}
                    results={diceResults}
                    isRolling={isRolling}
                    rollTrigger={rollTrigger}
                    animationMode="full"
                    height={220}
                    className="h-full w-full"
                    style={{ background: 'transparent', borderRadius: 0 }}
                  />
                </div>
              </div>

              <p
                className={`mt-3 flex items-center justify-center gap-1.5 text-base font-bold tabular-nums ${riskTextClass}`}
              >
                <TrendArrowIcon up className="h-3 w-3 shrink-0" />
                Шанс на успех: {successChance}%
              </p>
              <p className="mt-1 text-center text-xs text-slate-500">
                D20 + {Math.floor(reputation)} (репутация)
              </p>

              {phase === 'settling' && rollOutcome ? (
                <p
                  className={`mt-3 text-center text-sm font-bold ${
                    rollOutcome.success ? 'text-emerald-400' : 'text-rose-500'
                  }`}
                >
                  {rollOutcome.success ? 'Успех!' : 'Промах'} — D20: {rollOutcome.d20}, итого{' '}
                  {rollOutcome.roll} (нужно {rollOutcome.target}+)
                </p>
              ) : null}
            </section>

            <footer className="w-full space-y-5">
              <div className="rounded-xl bg-slate-800/60 p-3">
                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Цена сейчас
                    </span>
                    <MoneyValue amount={offer.offerPrice} size="md" color="white" />
                  </div>

                  <div className="hidden h-8 w-px bg-slate-600/60 sm:block" aria-hidden />

                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Предлагаете
                    </span>
                    <MoneyValue amount={proposedPrice} size="md" color="emerald" />
                  </div>
                </div>
              </div>

              <div>
                <div className="relative w-full">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-1/2 h-3.5 -translate-y-1/2 rounded-full"
                    style={{
                      background:
                        'linear-gradient(to right, rgb(16 185 129 / 0.85) 0%, rgb(52 211 153 / 0.55) 28%, rgb(239 68 68 / 0.85) 100%)',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-0.5 top-1/2 h-2 -translate-y-1/2 rounded-full bg-black/25" />

                  <input
                    type="range"
                    min={NEGOTIATE_MIN_ADJUSTMENT}
                    max={NEGOTIATE_MAX_ADJUSTMENT}
                    step={1}
                    value={adjustment}
                    disabled={controlsLocked}
                    onChange={(event) => setAdjustment(Number(event.target.value))}
                    className="negotiate-horizontal-slider relative z-10"
                    aria-label="Наценка сделки"
                    aria-valuemin={NEGOTIATE_MIN_ADJUSTMENT}
                    aria-valuemax={NEGOTIATE_MAX_ADJUSTMENT}
                    aria-valuenow={adjustment}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[10px] font-black uppercase tracking-[0.18em]">
                  <span className="text-emerald-400/90">{NEGOTIATE_MIN_ADJUSTMENT}% Легко</span>
                  <span className="text-red-400/90">+{NEGOTIATE_MAX_ADJUSTMENT}% Риск</span>
                </div>
              </div>

              <div className="relative flex min-h-12 items-center justify-center">
                <button
                  type="button"
                  disabled={controlsLocked}
                  onClick={handleClose}
                  className="absolute left-0 rounded-lg bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Отмена
                </button>

                <button
                  type="button"
                  disabled={controlsLocked}
                  onClick={() => void handleRoll()}
                  className="rounded-xl bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-600 px-10 py-3.5 text-sm font-black uppercase tracking-[0.14em] text-amber-950 shadow-[0_0_20px_rgba(234,179,8,0.3),0_4px_0_#b45309,inset_0_1px_0_rgba(255,255,255,0.35)] transition hover:from-amber-200 hover:via-yellow-400 hover:to-amber-500 hover:shadow-[0_0_28px_rgba(234,179,8,0.45),0_4px_0_#b45309] active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0"
                >
                  {phase === 'settling' ? 'Бросаем...' : 'Бросить кубик'}
                </button>
              </div>
            </footer>
          </>
        ) : null}
      </div>
    </GameModal>
  );
}
