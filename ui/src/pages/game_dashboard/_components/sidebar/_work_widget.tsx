import { MoneyValue } from '../../../../components/money/money_value'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { format_turns_left_label, turnsUntilSalary as calcTurnsUntilSalary } from '../../_model/utils'
import { SalaryTurnSegments } from './_salary_turn_segments'
import { SidebarSection } from '../shared'

type WorkWidgetVariant = 'compact' | 'full'

export function WorkWidget({ variant = 'compact' }: { variant?: WorkWidgetVariant }) {
  const theme = useDashboardTheme()
  const { activeTab } = useDashboardUi()
  const effectiveVariant = activeTab === 'character' ? 'compact' : variant

  const salary = useGameStore((state) => state.characterStats.effectiveSalary)
  const turn = useGameStore((state) => state.turn)
  const turnsLeft = calcTurnsUntilSalary(turn)

  if (effectiveVariant === 'compact') {
    return (
      <SidebarSection title="Работа" theme={theme}>
        <div className="relative rounded-xl border border-[var(--border-subtle,rgba(255,255,255,0.06))] bg-[var(--surface-inset,rgba(2,6,23,0.55))] p-3">
          <div className="mb-2 flex items-start justify-between gap-2">
            <p className={`text-xs font-medium text-[var(--text-secondary,#94a3b8)]`}>
              До зарплаты
            </p>
            <span className={`shrink-0 text-xs ${theme.secondaryText}`}>
              {turnsLeft === 0 ? (
                <span className="font-medium text-emerald-300">в следующем ходу</span>
              ) : (
                <span className="font-medium text-slate-200">
                  {format_turns_left_label(turnsLeft)}
                </span>
              )}
            </span>
          </div>
          <SalaryTurnSegments turnsUntilSalary={turnsLeft} />
          <div className="mt-3">
            <MoneyValue amount={salary} size="lg" suffix="/мес" />
          </div>
        </div>
      </SidebarSection>
    )
  }

  return null
}
