export function TrendArrow({ up }: { up: boolean }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`inline-block h-3 w-3 ${up ? 'text-emerald-400' : 'text-red-400'}`}
      fill="currentColor"
      aria-hidden
    >
      {up ? (
        <path d="M6 2l4 6H2L6 2z" />
      ) : (
        <path d="M6 10L2 4h8L6 10z" />
      )}
    </svg>
  )
}
