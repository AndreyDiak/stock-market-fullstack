import type { ReactNode } from 'react'
import { AssetImageFrame } from '../../../../shared/components'

export function BankPropertyModalHeader({
  titleId,
  itemRef,
  name,
  badges,
  description,
}: {
  titleId: string
  itemRef: string
  name: string
  badges: ReactNode
  description?: string | null
}) {
  return (
    <header className="bank-operation-modal__header">
      <div className="bank-operation-modal__asset">
        <AssetImageFrame assetId={itemRef} alt={name} width="4.75rem" height="4.75rem" />

        <div className="bank-operation-modal__heading">
          <h3 id={titleId} className="bank-operation-modal__title">
            {name}
          </h3>
          <div className="bank-operation-modal__badges">{badges}</div>
          {description ? (
            <p className="bank-property-modal__description">{description}</p>
          ) : null}
        </div>
      </div>
    </header>
  )
}
