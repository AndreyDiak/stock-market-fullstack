import type { IconProps } from './types'

export function TradingChartIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
      {...props}
    >
      <path strokeLinecap="round" d="M4 18h16M6 14l3-8 4 6 3-4 2 6" />
    </svg>
  )
}
