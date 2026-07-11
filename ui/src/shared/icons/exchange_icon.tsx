import type { IconProps } from './types'

export function ExchangeIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
      {...props}
    >
      <path strokeLinecap="round" d="M4 18V6l4 3 4-5 4 4 4-6v11" />
    </svg>
  )
}
