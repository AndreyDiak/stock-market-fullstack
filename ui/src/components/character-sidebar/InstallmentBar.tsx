import { motion } from 'framer-motion'
import MoneyValue from './MoneyValue'

interface InstallmentBarProps {
  name: string
  basePrice: number
  monthlyPayment: number
  installmentsPaid: number
  installmentsTotal: number
  animateProgress?: boolean
}

export default function InstallmentBar({
  name,
  basePrice,
  monthlyPayment,
  installmentsPaid,
  installmentsTotal,
  animateProgress = false,
}: InstallmentBarProps) {
  const progress = Math.round((installmentsPaid / installmentsTotal) * 100)

  return (
    <div className="rounded-2xl border border-emerald-400/10 bg-slate-800/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="mb-3">
        <p className="min-w-0 truncate text-sm font-bold text-white">{name}</p>
        <div className="flex shrink-0 items-center justify-between">
          <MoneyValue amount={monthlyPayment} suffix="/мес" size="sm" />
          <MoneyValue amount={basePrice} size="sm" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700/80">
          {animateProgress ? (
            <motion.div
              className="h-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.75)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{
                type: 'spring',
                stiffness: 90,
                damping: 18,
                delay: 0.15,
              }}
            />
          ) : (
            <div
              className="h-full rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.75)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          )}
        </div>
        <motion.span
          key={progress}
          className="shrink-0 text-xs font-bold text-emerald-400"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 22 }}
        >
          {progress}%
        </motion.span>
      </div>
    </div>
  )
}
