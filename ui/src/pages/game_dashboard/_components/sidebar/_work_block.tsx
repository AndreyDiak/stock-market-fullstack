import { MoneyValue } from '../../../../components/money/money_value'
import { BriefcaseIcon } from '../../../../shared/icons'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardTheme } from '../../_model/use_dashboard_theme'
import { turnsUntilSalary as calcTurnsUntilSalary } from '../../_model/utils'
import { SalaryTurnSegments } from './_salary_turn_segments'
import { SidebarSection } from '../shared'

export function WorkBlock() {
  const theme = useDashboardTheme()
  const careerLevel = useGameStore((state) => state.characterStats.workLevel)
  const salary = useGameStore((state) => state.characterStats.effectiveSalary)
  const turn = useGameStore((state) => state.turn)
  const turnsLeft = calcTurnsUntilSalary(turn)

  return (
    <SidebarSection
      title="Работа"
      theme={theme}
      action={
        <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-emerald-400">
          Lv.{careerLevel}
        </span>
      }
    >
      <div
        className={`overflow-hidden rounded-xl border p-3 ${
          theme.isLight ? theme.sidebarInset : 'border-slate-600/30 bg-slate-800/50'
        }`}
      >
        <div className="mb-3 flex items-center gap-2">
          <BriefcaseIcon className="h-4 w-4 shrink-0 text-emerald-400" />
          <p className={`text-[11px] font-medium uppercase tracking-wider ${theme.secondaryText}`}>
            До зарплаты
          </p>
        </div>

        <SalaryTurnSegments turnsUntilSalary={turnsLeft} />

        <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
          <MoneyValue amount={salary} size="xl" suffix="/мес" />
          <span className={`text-sm ${theme.secondaryText}`}>
            {turnsLeft === 0 ? (
              <span className="font-medium text-emerald-300">в следующем ходу</span>
            ) : (
              <>
                через{' '}
                <span
                  className={`font-medium ${theme.isLight ? 'text-slate-700' : 'text-slate-200'}`}
                >
                  {turnsLeft}{' '}
                  {turnsLeft === 1 ? 'ход' : turnsLeft < 5 ? 'хода' : 'ходов'}
                </span>
              </>
            )}
          </span>
        </div>
      </div>
    </SidebarSection>
  )
}
