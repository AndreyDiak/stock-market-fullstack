import type { IconProps } from './types'

export function CoinIcon({ className = 'h-5 w-5', ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`shrink-0 ${className}`} {...props}>
      <circle cx="12" cy="12" r="10" fill="#fbbf24" />
      <circle cx="12" cy="12" r="7.5" fill="#f59e0b" />
      <circle cx="12" cy="12" r="5.5" fill="#fbbf24" opacity="0.55" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#92400e"
      >
        $
      </text>
    </svg>
  )
}
