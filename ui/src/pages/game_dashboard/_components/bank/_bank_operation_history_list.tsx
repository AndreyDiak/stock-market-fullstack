import { useState } from 'react'

import { MoneyValue } from '../../../../components/money/money_value'
import { EyeIcon } from '../../../../shared/icons'
import { CategoryChip, StatusBadge } from '../shared'
import { BankOperationHistoryModal } from './_bank_operation_history_modal'
import type { PropertyOperation } from './_bank_operation_history'
import { formatOperationPriceDiff } from './_bank_operation_price_diff'
import { BankPropertyPreview } from './_bank_property_preview'

function HistoryOpenHint() {
  return (
    <span className="bank-history__open-hint" aria-hidden>
      <EyeIcon className="bank-history__open-hint-icon" />
    </span>
  )
}

function HistoryPriceDiff({ operation }: { operation: PropertyOperation }) {
  const priceDiffView = formatOperationPriceDiff(operation)
  if (!priceDiffView) return null

  return (
    <span
      className={[
        'bank-history__price-diff',
        `bank-history__price-diff--${priceDiffView.tone}`,
      ].join(' ')}
    >
      {priceDiffView.label}
    </span>
  )
}

export function BankOperationHistoryList({ operations }: { operations: PropertyOperation[] }) {
  const [selectedOperation, setSelectedOperation] = useState<PropertyOperation | null>(null)

  if (operations.length === 0) {
    return (
      <div className="bank-history__empty">
        Пока нет операций с имуществом
      </div>
    )
  }

  return (
    <>
      <ul className="bank-history__list">
        {operations.map((operation) => (
          <li key={operation.id}>
            <button
              type="button"
              className="bank-history__item"
              onClick={() => setSelectedOperation(operation)}
              aria-label={`Подробнее: ${operation.type === 'buy' ? 'покупка' : 'продажа'} ${operation.itemName}`}
            >
              <BankPropertyPreview
                itemRef={operation.itemRef}
                name={operation.itemName}
                size="history"
              />

              <div className="bank-history__content">
                <div className="bank-history__title-row">
                  <span className="bank-history__name">{operation.itemName}</span>
                  <StatusBadge tone={operation.type === 'buy' ? 'sky' : 'amber'}>
                    {operation.type === 'buy' ? 'Покупка' : 'Продажа'}
                  </StatusBadge>
                </div>

                <div className="bank-history__meta">
                  <MoneyValue amount={operation.price} size="xs" color="amber" className="inline-flex" />
                  {operation.type === 'buy' && operation.paymentLabel ? (
                    <>
                      <span className="bank-history__meta-separator" aria-hidden>
                        ·
                      </span>
                      <CategoryChip>{operation.paymentLabel}</CategoryChip>
                    </>
                  ) : null}
                  <HistoryPriceDiff operation={operation} />
                </div>
              </div>

              <div className="bank-history__aside">
                <span className="bank-history__time">{operation.timeLabel}</span>
                <HistoryOpenHint />
              </div>
            </button>
          </li>
        ))}
      </ul>

      <BankOperationHistoryModal
        operation={selectedOperation}
        onClose={() => setSelectedOperation(null)}
      />
    </>
  )
}
