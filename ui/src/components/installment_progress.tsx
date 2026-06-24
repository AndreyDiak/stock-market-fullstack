import { MoneyAmount } from './money_amount'

interface InstallmentProgressProps {
  name?: string
  basePrice?: number
  monthlyPayment?: number
  installmentsPaid?: number
  installmentsTotal?: number
  empty?: boolean
  theme?: 'light' | 'night'
}

export function InstallmentProgress({
  name,
  basePrice = 0,
  monthlyPayment = 0,
  installmentsPaid = 0,
  installmentsTotal = 1,
  empty = false,
  theme = 'light',
}: InstallmentProgressProps) {
  const isNight = theme === 'night'

  if (empty) {
    return (
      <div
        className={`h-[52px] rounded-lg border border-dashed ${
          isNight ? 'border-emerald-400/20 bg-white/5' : 'border-pastel-200/40 bg-pastel-50/20'
        }`}
      />
    )
  }

  const progress = Math.round((installmentsPaid / installmentsTotal) * 100)

  return (
    <div
      className={`rounded-lg px-2.5 py-1.5 ${
        isNight ? 'bg-white/5 backdrop-blur-sm' : 'bg-white/50'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span
          className={`min-w-0 truncate text-xs font-semibold ${isNight ? 'text-emerald-100' : 'text-pastel-800'}`}
        >
          {name}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <MoneyAmount amount={monthlyPayment} suffix="/мес" size="sm" theme={theme} />
          <span className={`text-xs ${isNight ? 'text-emerald-500/40' : 'text-pastel-400'}`}>·</span>
          <MoneyAmount amount={basePrice} size="sm" theme={theme} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`h-1.5 flex-1 overflow-hidden rounded-full ${
            isNight ? 'bg-emerald-950/80' : 'bg-pastel-200/80'
          }`}
        >
          <div
            className={`h-full rounded-full transition-all ${
              isNight
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(77,196,141,0.6)]'
                : 'bg-pastel-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span
          className={`shrink-0 text-xs font-semibold ${isNight ? 'text-emerald-400' : 'text-pastel-600'}`}
        >
          {progress}%
        </span>
      </div>
    </div>
  )
}
