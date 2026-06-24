import moneyIcon from '../assets/money/money_3.png'

interface MoneyAmountProps {
  amount: number
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
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
}: MoneyAmountProps) {
  const sizes = sizeClasses[size]

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold text-pastel-900 ${className}`}>
      <img
        src={moneyIcon}
        alt=""
        aria-hidden
        className={`${sizes.icon} shrink-0 object-contain`}
      />
      <span className={sizes.text}>
        {amount.toLocaleString()}
        {suffix && <span className="font-medium text-pastel-600">{suffix}</span>}
      </span>
    </span>
  )
}
