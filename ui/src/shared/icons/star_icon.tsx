import type { IconProps } from './types'

export function StarIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
      {...props}
    >
      <path d="M12 2l2.9 6.9 7.5.6-5.7 4.9 1.7 7.3L12 18.8 7.6 21.7l1.7-7.3L3.6 9.5l7.5-.6L12 2z" />
    </svg>
  )
}
