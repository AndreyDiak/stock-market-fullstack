import { motion } from 'framer-motion'
import { SegmentBar, ratioToPercent } from '../game_dashboard/segment_bar'
import { MoneyValue } from '../money_value'

interface InstallmentBarProps {
  name: string
  basePrice: number
  monthlyPayment: number
  installmentsPaid: number
  installmentsTotal: number
  animateProgress?: boolean
}

export function InstallmentBar({
  name,
  basePrice,
  monthlyPayment,
  installmentsPaid,
  installmentsTotal,
  animateProgress = false,
}: InstallmentBarProps) {
  const progress = ratioToPercent(installmentsPaid, installmentsTotal)

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
        {animateProgress ? (
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, scaleX: 0.92 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.15 }}
            style={{ transformOrigin: 'left center' }}
          >
            <SegmentBar percent={progress} variant="emerald" />
          </motion.div>
        ) : (
          <SegmentBar percent={progress} variant="emerald" className="flex-1" />
        )}
        <motion.span
          key={progress}
          className="shrink-0 text-xs font-bold text-emerald-400"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 22 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  )
}
