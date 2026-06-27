import { MoneyValue } from '../../../../components/money/money_value'
import { BriefcaseIcon } from '../../../../shared/icons'
import type { CharacterStats } from './_character_skills'

interface ProfileWorkCardProps {
  baseSalary: number
  stats: CharacterStats
  className?: string
}

export function ProfileWorkCard({ baseSalary, stats, className = '' }: ProfileWorkCardProps) {
  const hasBonus = stats.qualificationBonusPercent > 0

  return (
    <section
      className={`flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/40 p-5 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="h-4 w-4 shrink-0 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Работа</h3>
        </div>
        <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-emerald-400">
          уровень {stats.workLevel}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Зарплата
            </p>
            <MoneyValue amount={stats.effectiveSalary} size="xl" suffix="/мес" className="mt-1" />
          </div>

          {hasBonus && (
            <p className="text-xs text-slate-400">
              Базовая{' '}
              <MoneyValue amount={baseSalary} size="xs" color="muted" className="inline-flex" />
              <span className="text-emerald-400">
                {' '}
                +{stats.qualificationBonusPercent}% от квалификации
              </span>
            </p>
          )}
        </div>

        <p className="text-xs leading-relaxed text-slate-500">
          Начисляется каждые 5 ходов. Прокачивайте «Повышение квалификации», чтобы увеличить доход.
        </p>
      </div>
    </section>
  )
}
