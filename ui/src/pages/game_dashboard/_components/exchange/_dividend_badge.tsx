export function DividendBadge({
  turnsUntilDividend,
  className = '',
}: {
  turnsUntilDividend: number | null;
  className?: string;
}) {
  if (turnsUntilDividend != null && turnsUntilDividend > 0) {
    return (
      <span
        className={`rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 ${className}`}
        title={`Дивиденды через ${turnsUntilDividend} ход(ов)`}
      >
        Див {turnsUntilDividend} ход
      </span>
    )
  }

  return (
    <span
      className={`rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-200 ${className}`}
      title="Дивидендная акция"
    >
      Див
    </span>
  )
}
