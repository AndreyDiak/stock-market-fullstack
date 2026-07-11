import type { IconProps } from './types'

export function GraduationCapIcon({ className, ...props }: IconProps) {
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
      <path strokeLinecap="round" d="M12 14l9-5-9-5-9 5 9 5z" />
      <path
        strokeLinecap="round"
        d="M12 14l6.16-3.422a12.083 12.083 0 0 1 .665 6.479A11.952 11.952 0 0 0 12 20.055a11.952 11.952 0 0 0-6.824-2.998 12.078 12.078 0 0 1 .665-6.479L12 14z"
      />
    </svg>
  )
}
