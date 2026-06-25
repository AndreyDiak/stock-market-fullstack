import type { IconProps } from './types'

interface DealArrowIconProps extends IconProps {
  direction: 'buy' | 'sell'
}

export function DealArrowIcon({ direction, className, ...props }: DealArrowIconProps) {
  const playerBuys = direction === 'buy'

  return (
    <svg viewBox="0 0 16 16" className={className} fill="currentColor" aria-hidden {...props}>
      {playerBuys ? (
        <path d="M8 11L3 6h3V2h4v4h3L8 11z" />
      ) : (
        <path d="M8 5l5 5h-3v4H6v-4H3l5-5z" />
      )}
    </svg>
  )
}
