import { MoneyValue } from './money_value'

interface MoneyAmountProps {
  amount: number
  suffix?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  theme?: 'light' | 'night'
}

export function MoneyAmount({
  amount,
  suffix,
  size = 'md',
  className = '',
  theme = 'light',
}: MoneyAmountProps) {
  const isNight = theme === 'night'
  const mappedSize = size === 'lg' ? 'lg' : size === 'sm' ? 'sm' : 'md'

  return (
    <MoneyValue
      amount={amount}
      suffix={suffix}
      size={mappedSize}
      color="inherit"
      className={className}
      amountClassName={isNight ? 'text-emerald-100' : 'text-pastel-900'}
    />
  )
}
