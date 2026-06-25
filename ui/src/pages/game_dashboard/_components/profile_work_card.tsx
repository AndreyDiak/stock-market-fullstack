import { MoneyValue } from '../../../components/money/money_value'
import { BriefcaseIcon } from '../../../shared/icons'
import { calcEffectiveSalary, calcWorkLevel } from './character_skills'

interface ProfileWorkCardProps {
  baseSalary: number
  qualificationLevel: number
}

export function ProfileWorkCard({
  baseSalary,
  qualificationLevel,
}: ProfileWorkCardProps) {
  const workLevel = calcWorkLevel(qualificationLevel)
  const effectiveSalary = calcEffectiveSalary(baseSalary, qualificationLevel)
  const hasBonus = qualificationLevel > 1

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-800/40 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BriefcaseIcon className="h-4 w-4 shrink-0 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Работа</h3>
        </div>
        <span className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-bold tabular-nums text-emerald-400">
          Lv.{workLevel}
        </span>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Зарплата
          </p>
          <MoneyValue amount={effectiveSalary} size="xl" suffix="/мес" className="mt-1" />
        </div>

        {hasBonus && (
          <p className="text-xs text-slate-400">
            Базовая{' '}
            <MoneyValue amount={baseSalary} size="xs" color="muted" className="inline-flex" />
            <span className="text-emerald-400">
              {' '}
              +{(qualificationLevel - 1) * 10}% от квалификации
            </span>
          </p>
        )}

        <p className="text-xs leading-relaxed text-slate-500">
          Начисляется каждые 5 ходов. Прокачивайте «Повышение квалификации», чтобы увеличить доход.
        </p>
      </div>
    </section>
  )
}
