import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import { useState } from 'react';
import './_dividend_badge.css';

export function DividendBadge({
  turnsUntilDividend,
  className = '',
}: {
  turnsUntilDividend: number | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const label =
    turnsUntilDividend != null && turnsUntilDividend > 0
      ? `Дивиденды через ${turnsUntilDividend} ход(ов)`
      : 'Дивидендная акция';

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    whileElementsMounted: autoUpdate,
    middleware: [offset(6), flip(), shift({ padding: 8 })],
  });

  const hover = useHover(context, { delay: { open: 120, close: 80 } });
  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'tooltip' });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role]);

  return (
    <>
      <span
        ref={refs.setReference}
        className={['dividend-badge', className].filter(Boolean).join(' ')}
        aria-label={label}
        {...getReferenceProps()}
      >
        Див
      </span>

      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            className="dividend-badge__tooltip"
            style={floatingStyles}
            {...getFloatingProps()}
          >
            {label}
          </div>
        </FloatingPortal>
      ) : null}
    </>
  );
}
