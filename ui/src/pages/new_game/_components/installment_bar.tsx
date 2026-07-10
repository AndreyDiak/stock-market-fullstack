import { motion } from "framer-motion";
import {
  SegmentBar,
  ratioToPercent,
} from '../../game_dashboard/_components/shared';
import { MoneyValue } from '../../../components/money/money_value';

interface InstallmentBarProps {
  name: string;
  basePrice: number;
  monthlyPayment: number;
  installmentsPaid: number;
  installmentsTotal: number;
  animateProgress?: boolean;
  compact?: boolean;
  className?: string;
}

export function InstallmentBar({
  name,
  basePrice,
  monthlyPayment,
  installmentsPaid,
  installmentsTotal,
  animateProgress = false,
  compact = false,
  className = "",
}: InstallmentBarProps) {
  const progress = ratioToPercent(installmentsPaid, installmentsTotal);

  if (compact) {
    return (
      <div className={`min-w-0 flex-1 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <MoneyValue amount={monthlyPayment} suffix="/мес" size="xs" className="min-w-0 shrink" />
          <MoneyValue amount={basePrice} size="xs" className="shrink-0 text-slate-400" />
        </div>
        <div className="mt-1.5 flex items-center gap-2">
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
          <span className="shrink-0 text-[10px] font-bold text-emerald-400">{Math.round(progress)}%</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-emerald-400/10 bg-slate-800/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${className}`}
    >
      <div className="mb-3 min-w-0">
        <p className="truncate text-sm font-bold text-white">{name}</p>
        <div className="mt-1 flex min-w-0 items-center justify-between gap-2">
          <MoneyValue
            amount={monthlyPayment}
            suffix="/мес"
            size="sm"
            className="min-w-0 shrink"
          />
          <MoneyValue amount={basePrice} size="sm" className="shrink-0" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {animateProgress ? (
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, scaleX: 0.92 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{
              type: "spring",
              stiffness: 90,
              damping: 18,
              delay: 0.15,
            }}
            style={{ transformOrigin: "left center" }}
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
          transition={{
            delay: 0.2,
            type: "spring",
            stiffness: 400,
            damping: 22,
          }}
        >
          {Math.round(progress)}%
        </motion.span>
      </div>
    </div>
  );
}
