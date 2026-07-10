import { format_turns_left_label } from '../../_model/utils'
import './_dividend_badge.css'

export function DividendBadge({
  turnsUntilDividend,
  className = '',
}: {
  turnsUntilDividend: number | null
  className?: string
}) {
  const label =
    turnsUntilDividend != null && turnsUntilDividend > 0
      ? `Дивиденды через ${format_turns_left_label(turnsUntilDividend)}`
      : 'Дивиденды'

  return (
    <span className={`dividend-badge ${className}`.trim()} title={label}>
      {label}
    </span>
  )
}
