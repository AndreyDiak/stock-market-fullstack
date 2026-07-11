import { format_change } from '../../_model/utils';

type StockChangeBadgeProps = {
  label?: string;
  value: number | null;
  emphasis?: 'primary' | 'secondary';
  ariaLabel?: string;
};

function getToneClass(value: number | null, emphasis: 'primary' | 'secondary') {
  if (value == null) {
    return emphasis === 'primary'
      ? 'stock-change-badge--muted-primary'
      : 'stock-change-badge--muted-secondary';
  }

  if (value > 0) {
    return emphasis === 'primary' ? 'stock-change-badge--up-primary' : 'stock-change-badge--up-secondary';
  }

  if (value < 0) {
    return emphasis === 'primary'
      ? 'stock-change-badge--down-primary'
      : 'stock-change-badge--down-secondary';
  }

  return emphasis === 'primary'
    ? 'stock-change-badge--neutral-primary'
    : 'stock-change-badge--neutral-secondary';
}

export function StockChangeBadge({
  label,
  value,
  emphasis = 'primary',
  ariaLabel,
}: StockChangeBadgeProps) {
  return (
    <span
      className={`stock-change-badge stock-change-badge--${emphasis} ${getToneClass(value, emphasis)}${
        label ? '' : ' stock-change-badge--value-only'
      }`}
      aria-label={ariaLabel}
    >
      {label ? <span className="stock-change-badge__label">{label}</span> : null}
      <span className="stock-change-badge__value">{value == null ? '—' : format_change(value)}</span>
    </span>
  );
}
