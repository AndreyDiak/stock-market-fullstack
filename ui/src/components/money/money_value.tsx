import { CoinIcon } from '../../shared/icons'

export function formatMoney(amount: number, locale = 'ru-RU') {
  return amount.toLocaleString(locale)
}

type MoneyValueSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
type MoneyValueColor = 'emerald' | 'amber' | 'cyan' | 'red' | 'white' | 'muted' | 'inherit'
type MoneyValueTone = 'default' | 'overlay'

const sizeClasses = {
  xs: { value: 'text-xs', coin: 'h-3 w-3', suffix: 'text-[10px]' },
  sm: { value: 'text-sm', coin: 'h-4 w-4', suffix: 'text-xs' },
  md: { value: 'text-base', coin: 'h-5 w-5', suffix: 'text-xs' },
  lg: { value: 'text-lg', coin: 'h-5 w-5', suffix: 'text-sm' },
  xl: { value: 'text-xl', coin: 'h-5 w-5', suffix: 'text-sm' },
  '2xl': { value: 'text-2xl', coin: 'h-6 w-6', suffix: 'text-base' },
} as const

const colorClasses: Record<MoneyValueColor, string> = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-300',
  cyan: 'text-cyan-300',
  red: 'text-red-400',
  white: 'text-white',
  muted: 'text-slate-300',
  inherit: '',
}

const textShadow = '[text-shadow:0_1px_4px_rgba(0,0,0,0.95),0_0_12px_rgba(0,0,0,0.6)]'

export interface MoneyValueProps {
  amount: number
  suffix?: string
  prefix?: string
  size?: MoneyValueSize
  color?: MoneyValueColor
  negative?: boolean
  tone?: MoneyValueTone
  className?: string
  amountClassName?: string
  tabular?: boolean
  locale?: string
}

export function MoneyValue({
  amount,
  suffix,
  prefix,
  size = 'md',
  color = 'emerald',
  negative = false,
  tone = 'default',
  className = '',
  amountClassName = '',
  tabular = true,
  locale = 'ru-RU',
}: MoneyValueProps) {
  const sizes = sizeClasses[size]
  const isOverlay = tone === 'overlay'
  const resolvedColor = negative ? 'red' : color
  const displayPrefix = prefix ?? (negative ? '−' : '')

  const valueTextClass = isOverlay
    ? `text-white ${textShadow}`
    : negative
      ? colorClasses.red
      : color === 'inherit'
        ? amountClassName
        : `${colorClasses[resolvedColor]} ${amountClassName}`.trim()

  const suffixColorClass = isOverlay
    ? `text-white/80 ${textShadow}`
    : color === 'inherit'
      ? 'text-slate-400'
      : resolvedColor === 'emerald'
        ? 'text-emerald-400/80'
        : 'text-slate-400'

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CoinIcon className={sizes.coin} />
      <span className={`font-bold ${sizes.value} ${tabular ? 'tabular-nums' : ''} ${valueTextClass}`}>
        {displayPrefix}
        {formatMoney(amount, locale)}
      </span>
      {suffix && (
        <span className={`font-medium ${sizes.suffix} ${suffixColorClass}`}>{suffix}</span>
      )}
    </span>
  )
}
