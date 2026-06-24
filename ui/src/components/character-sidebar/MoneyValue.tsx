import CoinIcon from './CoinIcon'

interface MoneyValueProps {
  amount: number
  suffix?: string
  size?: 'sm' | 'md'
  negative?: boolean
  tone?: 'default' | 'overlay'
}

const sizeClasses = {
  sm: { value: 'text-sm', coin: 'h-4 w-4' },
  md: { value: 'text-base', coin: 'h-5 w-5' },
} as const

const textShadow = '[text-shadow:0_1px_4px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.6)]'

export default function MoneyValue({
  amount,
  suffix,
  size = 'md',
  negative = false,
  tone = 'default',
}: MoneyValueProps) {
  const sizes = sizeClasses[size]
  const isOverlay = tone === 'overlay'

  return (
    <span className="inline-flex items-center gap-1.5">
      <CoinIcon className={sizes.coin} />
      <span
        className={`font-bold ${sizes.value} ${
          isOverlay
            ? `text-white ${textShadow}`
            : negative
              ? 'text-red-400'
              : 'text-emerald-400'
        }`}
      >
        {amount.toLocaleString()}
      </span>
      {suffix && (
        <span
          className={`text-xs font-medium ${
            isOverlay ? `text-white/80 ${textShadow}` : 'text-slate-400'
          }`}
        >
          {suffix}
        </span>
      )}
    </span>
  )
}
