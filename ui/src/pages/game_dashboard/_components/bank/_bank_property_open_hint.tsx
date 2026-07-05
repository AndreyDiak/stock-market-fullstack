import { EyeIcon } from '../../../../shared/icons'

export function BankPropertyOpenHint({ className = '' }: { className?: string }) {
  return (
    <span className={`bank-property-open-hint ${className}`.trim()} aria-hidden>
      <EyeIcon className="bank-property-open-hint__icon" />
    </span>
  )
}
