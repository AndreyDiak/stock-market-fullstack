import { GameButton } from '../../../../components/game_ui/game_button';
import { LockOutlineIcon } from '../../../../shared/icons';

const ACTION_BUTTON_CLASS =
  'flex h-11 min-h-[2.75rem] w-full items-center justify-center gap-1.5 !rounded-lg px-2 py-2 text-[10px] font-bold uppercase leading-none tracking-[0.06em] whitespace-nowrap';

const BLOCKED_BUTTON_CLASS = `${ACTION_BUTTON_CLASS} !cursor-not-allowed !opacity-80 hover:!from-slate-700 hover:!via-slate-800 hover:!to-slate-900 active:!translate-y-0`;

export function StockCardFooter({
  locked,
  lockLabel,
  onDetails,
}: {
  locked: boolean;
  lockLabel: string;
  onDetails: () => void;
}) {
  return (
    <div className="asset-market-card__footer-panel">
      <div className="asset-market-card__actions asset-market-card__actions--single p-1.5">
        <div className="asset-market-card__primary-action">
          {locked ? (
            <GameButton
              variant="muted"
              size="sm"
              fullWidth
              disabled
              className={BLOCKED_BUTTON_CLASS}
              aria-label={lockLabel}
            >
              <LockOutlineIcon className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{lockLabel}</span>
            </GameButton>
          ) : (
            <GameButton
              variant="emerald"
              size="sm"
              fullWidth
              className={ACTION_BUTTON_CLASS}
              onClick={onDetails}
            >
              Подробнее
            </GameButton>
          )}
        </div>
      </div>
    </div>
  );
}
