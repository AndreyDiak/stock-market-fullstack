import moneyIcon from '../assets/money/money_3.png'

interface MoneyAmountProps {
  amount: number
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  theme?: 'light' | 'night'
}

const sizeClasses = {
  sm: { text: 'text-sm', icon: 'h-5 w-5' },
  md: { text: 'text-base', icon: 'h-6 w-6' },
  lg: { text: 'text-xl', icon: 'h-8 w-8' },
} as const

export default function MoneyAmount({
  amount,
  suffix,
  size = 'md',
  className = '',
  theme = 'light',
}: MoneyAmountProps) {
  const sizes = sizeClasses[size]
  const isNight = theme === 'night'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold ${
        isNight ? 'text-emerald-100' : 'text-pastel-900'
      } ${className}`}
    >
      <img
        src={moneyIcon}
        alt=""
        aria-hidden
        className={`${sizes.icon} shrink-0 object-contain ${isNight ? 'drop-shadow-[0_0_6px_rgba(77,196,141,0.5)]' : ''}`}
      />
      <span className={sizes.text}>
        {amount.toLocaleString()}
        {suffix && (
          <span className={`font-medium ${isNight ? 'text-emerald-400/80' : 'text-pastel-600'}`}>
            {suffix}
          </span>
        )}
      </span>
    </span>
  )
}
