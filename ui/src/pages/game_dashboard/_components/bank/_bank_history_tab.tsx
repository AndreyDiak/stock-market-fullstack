import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { BankOperationHistoryList } from './_bank_operation_history_list'
import type { PropertyOperation } from './_bank_operation_history'

export function BankHistoryTab({ operations }: { operations: PropertyOperation[] }) {
  const theme = useDashboardTheme()

  return (
    <div className={`bank-tab-panel__inner bank-tab-panel__inner--history ${theme.scrollArea}`}>
      <BankOperationHistoryList operations={operations} />
    </div>
  )
}
