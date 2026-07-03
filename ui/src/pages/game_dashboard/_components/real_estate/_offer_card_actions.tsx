import type { ReactNode } from 'react';
import { GameButton } from '../../../../components/game_ui/game_button';
import { gameAudio } from '../../../../lib/audio/game_audio';
import { ChatBubbleIcon, CoinIcon, LockOutlineIcon } from '../../../../shared/icons';
import type { PropertyOffer } from '../../_model/types';
import {
  formatBankingRequiredLabel,
  getPrimaryActionLabel,
  type AssetDealType,
} from './_offer_styles';
import { INSUFFICIENT_BALANCE_FOR_NEGOTIATE_REASON, hasInsufficientNegotiatePurchaseFunds } from './_accept_deal_utils';

const ACTION_BUTTON_CLASS =
  'flex h-11 min-h-[2.75rem] w-full items-center justify-center gap-1.5 !rounded-lg px-2 py-2 text-[10px] font-bold uppercase leading-none tracking-[0.06em] whitespace-nowrap';

const BLOCKED_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} !cursor-not-allowed !opacity-80 hover:!from-slate-700 hover:!via-slate-800 hover:!to-slate-900 active:!translate-y-0`;

function ActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      tabIndex={0}
      className="group/action-tip relative min-w-0"
      aria-label={label}
    >
      {children}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-[100] w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-slate-600/55 bg-slate-950/95 px-2.5 py-2 text-left text-[10px] leading-snug text-slate-300 opacity-0 shadow-[0_10px_24px_rgba(0,0,0,0.45)] transition-opacity duration-150 group-hover/action-tip:opacity-100 group-focus-within/action-tip:opacity-100"
      >
        {label}
      </div>
    </div>
  );
}

export function getNegotiateBlockReason(
  offer: PropertyOffer,
  noFreeSlots: boolean,
  isPurchase: boolean,
  notInInventory: boolean,
  balance: number,
  proposedPrice: number,
): string | null {
  if (noFreeSlots) return 'Нет свободных слотов для покупки';
  if (!isPurchase && notInInventory) return 'Нет в инвентаре';
  if (offer.isLocked) return formatBankingRequiredLabel(offer.requiredBankingLevel);
  if (
    hasInsufficientNegotiatePurchaseFunds(
      balance,
      isPurchase,
      proposedPrice,
      offer.downPaymentPercent,
    )
  ) {
    return INSUFFICIENT_BALANCE_FOR_NEGOTIATE_REASON;
  }
  return null;
}

function ActionsPanel({
  single,
  children,
}: {
  single: boolean;
  children: ReactNode;
}) {
  return (
    <div className="asset-market-card__footer-panel">
      <div
        className={[
          'asset-market-card__actions p-1.5',
          single ? 'asset-market-card__actions--single' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </div>
  );
}

export function OfferCardActions({
  dealType,
  blockReason,
  negotiateBlockReason,
  actionDisabled,
  negotiateDisabled,
  onAccept,
  onNegotiate,
}: {
  dealType: AssetDealType;
  blockReason: string | null;
  negotiateBlockReason: string | null;
  actionDisabled: boolean;
  negotiateDisabled: boolean;
  onAccept: () => void;
  onNegotiate: () => void;
}) {
  const primaryLabel = getPrimaryActionLabel(dealType);
  const primaryVariant = 'emerald';
  const blockedReason = blockReason ?? negotiateBlockReason;
  const showDual = !actionDisabled && !negotiateDisabled;
  const showPrimaryOnly = !actionDisabled && negotiateDisabled;
  const showNegotiateOnly = actionDisabled && !negotiateDisabled;
  const showBlocked = actionDisabled && negotiateDisabled;

  if (showBlocked) {
    if (blockedReason) {
      return (
        <ActionsPanel single>
          <div className="asset-market-card__primary-action">
            <GameButton
              variant="muted"
              size="sm"
              fullWidth
              disabled
              className={BLOCKED_BUTTON_CLASS}
              aria-label={blockedReason}
            >
              <LockOutlineIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{blockedReason}</span>
            </GameButton>
          </div>
        </ActionsPanel>
      );
    }

    return (
      <ActionsPanel single>
        <div className="asset-market-card__primary-action">
          <GameButton
            variant={primaryVariant}
            size="sm"
            fullWidth
            disabled
            className={ACTION_BUTTON_CLASS}
            aria-label={primaryLabel}
          >
            <CoinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>{primaryLabel}</span>
          </GameButton>
        </div>
      </ActionsPanel>
    );
  }

  const primaryButton = (
    <GameButton
      variant={primaryVariant}
      size="sm"
      fullWidth
      disabled={actionDisabled}
      onClick={() => {
        gameAudio.playSfx('buttonClick');
        onAccept();
      }}
      className={ACTION_BUTTON_CLASS}
      aria-label={primaryLabel}
    >
      <CoinIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{primaryLabel}</span>
    </GameButton>
  );

  const negotiateButton = (
    <GameButton
      variant="muted"
      size="sm"
      fullWidth
      disabled={negotiateDisabled}
      onClick={() => {
        gameAudio.playSfx('buttonClick');
        onNegotiate();
      }}
      className={`${ACTION_BUTTON_CLASS} asset-market-card__secondary-button`}
    >
      <ChatBubbleIcon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
      <span>Торговаться</span>
    </GameButton>
  );

  if (showPrimaryOnly) {
    return (
      <ActionsPanel single>
        <div className="asset-market-card__primary-action">{primaryButton}</div>
      </ActionsPanel>
    );
  }

  if (showNegotiateOnly) {
    const wrappedNegotiate =
      negotiateBlockReason ? (
        <ActionTooltip label={negotiateBlockReason}>{negotiateButton}</ActionTooltip>
      ) : (
        negotiateButton
      );

    return (
      <ActionsPanel single>
        <div className="asset-market-card__secondary-action">{wrappedNegotiate}</div>
      </ActionsPanel>
    );
  }

  if (showDual) {
    return (
      <ActionsPanel single={false}>
        <div className="asset-market-card__primary-action">{primaryButton}</div>
        <div className="asset-market-card__secondary-action">{negotiateButton}</div>
      </ActionsPanel>
    );
  }

  return null;
}
