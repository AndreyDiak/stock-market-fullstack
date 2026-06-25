import { MoneyValue } from '../../../components/money/money_value'
import {
  buildSkillCurrentInfographic,
  type CharacterSkill,
  type SkillInfographicChip,
} from './character_skills'

const chipBase =
  'inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/5 bg-slate-900/60 px-2 py-1 text-[10px] leading-tight'

function InfographicChip({ chip }: { chip: SkillInfographicChip }) {
  const valueTone =
    chip.tone === 'amber'
      ? 'text-amber-400'
      : chip.tone === 'emerald'
        ? 'text-emerald-400'
        : 'text-slate-300'

  return (
    <span className={chipBase}>
      <span className="shrink-0 font-semibold uppercase tracking-wide text-slate-500">
        {chip.label}
      </span>
      {chip.moneyAmount != null ? (
        <MoneyValue
          amount={chip.moneyAmount}
          size="xs"
          prefix="+"
          color={chip.moneyAmount > 0 ? 'emerald' : 'muted'}
          className="gap-1"
        />
      ) : (
        <span className={`font-bold tabular-nums ${valueTone}`}>{chip.value}</span>
      )}
    </span>
  )
}

interface SkillBonusInfographicProps {
  skill: CharacterSkill
  baseSalary: number
  className?: string
}

export function SkillBonusInfographic({
  skill,
  baseSalary,
  className = '',
}: SkillBonusInfographicProps) {
  if (skill.id === 'property_slots') {
    return <div className={className} />
  }

  const chips = buildSkillCurrentInfographic(skill, { baseSalary })
  if (chips.length === 0) return <div className={className} />

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      aria-label="Бонусы текущего уровня"
    >
      {chips.map((chip) => (
        <InfographicChip key={chip.id} chip={chip} />
      ))}
    </div>
  )
}
