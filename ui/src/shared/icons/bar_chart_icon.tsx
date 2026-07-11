import type { IconProps } from './types'

export function BarChartIcon({ className, ...props }: IconProps) {
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
      <path strokeLinecap="round" d="M4 19h16M6 16l3-8 4 5 3-4 2 3" />
    </svg>
  )
}
