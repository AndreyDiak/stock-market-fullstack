import { MoneyValue } from '../../../../components/money/money_value'

export function EffectChip({
  label,
  value,
  moneyAmount,
  tone,
}: {
  label: string
  value?: string
  moneyAmount?: number
  tone?: 'emerald' | 'amber'
}) {
  const valueTone =
    tone === 'amber'
      ? 'text-amber-300'
      : tone === 'emerald'
        ? 'text-emerald-300'
        : 'text-slate-200'

  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-[var(--surface-inset,rgba(2,6,23,0.55))] px-2 py-1 text-xs leading-tight">
      <span className="shrink-0 font-medium text-[var(--text-muted,#64748b)]">{label}</span>
      {moneyAmount != null ? (
        <MoneyValue
          amount={moneyAmount}
          size="xs"
          color={moneyAmount > 0 ? 'emerald' : 'muted'}
          prefix="+"
          className="inline-flex"
        />
      ) : (
        <span className={`font-bold tabular-nums ${valueTone}`}>{value}</span>
      )}
    </span>
  )
}
