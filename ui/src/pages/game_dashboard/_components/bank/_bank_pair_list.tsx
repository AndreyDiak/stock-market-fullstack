import type { ReactNode } from 'react'

export function PairList({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <dl className={`bank-pair-list ${className}`.trim()}>{children}</dl>
}

export function PairListGroup({ children }: { children: ReactNode }) {
  return <div className="bank-pair-list__group">{children}</div>
}

export function PairListRow({
  label,
  children,
  emphasis = false,
}: {
  label: string
  children: ReactNode
  emphasis?: boolean
}) {
  return (
    <div
      className={`bank-pair-list__row${emphasis ? ' bank-pair-list__row--emphasis' : ''}`}
    >
      <dt className="bank-pair-list__label">{label}</dt>
      <dd className="bank-pair-list__value">{children}</dd>
    </div>
  )
}
