import { SALARY_CYCLE_TURNS } from './model/constants'

export function SalaryTurnSegments({ turnsUntilSalary }: { turnsUntilSalary: number }) {
  const filled = Math.max(0, Math.min(SALARY_CYCLE_TURNS, SALARY_CYCLE_TURNS - turnsUntilSalary))

  return (
    <div
      className="mb-2 flex gap-1.5"
      role="progressbar"
      aria-valuenow={filled}
      aria-valuemin={0}
      aria-valuemax={SALARY_CYCLE_TURNS}
    >
      {Array.from({ length: SALARY_CYCLE_TURNS }, (_, index) => {
        const active = index < filled
        return (
          <div
            key={index}
            className={`h-2.5 flex-1 rounded-sm transition-colors duration-300 ${
              active
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.65)]'
                : 'bg-slate-700/60'
            }`}
          />
        )
      })}
    </div>
  )
}
