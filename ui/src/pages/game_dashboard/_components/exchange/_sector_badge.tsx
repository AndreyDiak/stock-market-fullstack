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
import './_sector_badge.css';
import { formatSectorLabel } from './_stock_grade_config';
import { getSectorIcon } from './_sector_icons';

export function SectorBadge({
  sector,
  className = '',
  size = 'sm',
}: {
  sector: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const label = formatSectorLabel(sector);
  const Icon = getSectorIcon(sector);

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

  const dimension = size === 'md' ? '1.75rem' : '1.5rem';

  return (
    <>
      <span
        ref={refs.setReference}
        className={['sector-badge', className].filter(Boolean).join(' ')}
        style={{ width: dimension, height: dimension }}
        aria-label={label}
        {...getReferenceProps()}
      >
        <Icon className="sector-badge__icon" width="100%" height="100%" />
      </span>

      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            className="sector-badge__tooltip"
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
