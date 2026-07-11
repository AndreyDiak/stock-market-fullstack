import type { IconProps } from './types'

interface TrendArrowIconProps extends IconProps {
  up: boolean
}

export function TrendArrowIcon({ up, className, ...props }: TrendArrowIconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={className}
      fill="currentColor"
      aria-hidden
      {...props}
    >
      {up ? (
        <path d="M6 2l4 6H2L6 2z" />
      ) : (
        <path d="M6 10L2 4h8L6 10z" />
      )}
    </svg>
  )
}
