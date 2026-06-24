import MoneyAmount from './MoneyAmount'

interface InstallmentProgressProps {
  name?: string
  monthlyPayment?: number
  installmentsPaid?: number
  installmentsTotal?: number
  empty?: boolean
}

export default function InstallmentProgress({
  name,
  monthlyPayment = 0,
  installmentsPaid = 0,
  installmentsTotal = 1,
  empty = false,
}: InstallmentProgressProps) {
  if (empty) {
    return (
      <div className="h-[52px] rounded-lg border border-dashed border-pastel-200/40 bg-pastel-50/20" />
    )
  }

  const progress = Math.round((installmentsPaid / installmentsTotal) * 100)

  return (
    <div className="rounded-lg bg-white/50 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-pastel-800">{name}</span>
        <MoneyAmount amount={monthlyPayment} suffix="/мес" size="sm" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pastel-200/80">
          <div
            className="h-full rounded-full bg-pastel-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold text-pastel-600">{progress}%</span>
      </div>
    </div>
  )
}
