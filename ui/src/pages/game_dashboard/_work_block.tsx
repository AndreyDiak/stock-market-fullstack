import { MoneyValue } from '../../components/money_value'
import type { right_panel_props } from './model/types'
import { SalaryTurnSegments } from './_salary_turn_segments'

export function WorkBlock({
  careerLevel,
  salary,
  turnsUntilSalary,
  theme,
}: Pick<right_panel_props, 'careerLevel' | 'salary' | 'turnsUntilSalary' | 'theme'>) {
  return (
    <section className="py-1">
      <div
        className={`rounded-2xl border p-3 ${
          theme.isLight ? 'border-slate-200/80' : 'border-white/10'
        } bg-transparent`}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-emerald-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
              <path strokeLinecap="round" d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
            </svg>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${theme.primaryText}`}>Работа</h3>
          </div>
          <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-emerald-400">
            Lv.{careerLevel}
          </span>
        </div>

        <SalaryTurnSegments turnsUntilSalary={turnsUntilSalary} />

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <MoneyValue amount={salary} size="xl" suffix="/мес" />
          <span className={`text-sm ${theme.secondaryText}`}>
            через{' '}
            <span className={`font-medium ${theme.isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {turnsUntilSalary} хода
            </span>
          </span>
        </div>
      </div>
    </section>
  )
}
