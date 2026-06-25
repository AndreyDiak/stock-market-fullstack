import { MoneyValue } from '../../../components/money/money_value'

interface StatRowProps {
  label: string
  amount: number
  suffix?: string
  negative?: boolean
  bordered?: boolean
}

export function StatRow({
  label,
  amount,
  suffix,
  negative = false,
  bordered = false,
}: StatRowProps) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        bordered ? 'border-t border-white/10 pt-4' : ''
      }`}
    >
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <MoneyValue amount={amount} suffix={suffix} negative={negative} />
    </div>
  )
}
