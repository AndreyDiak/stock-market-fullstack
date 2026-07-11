import type { IconProps } from './types'

export function NewsIcon({ className, ...props }: IconProps) {
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
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"
      />
      <path strokeLinecap="round" d="M7 9h10M7 12h10M7 15h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 5V3.5A1.5 1.5 0 0 0 15.5 2h-7A1.5 1.5 0 0 0 7 3.5V5" />
    </svg>
  )
}
