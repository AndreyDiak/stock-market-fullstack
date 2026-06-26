import { MoneyValue } from '../../../../components/money/money_value'
import type { CharacterSkill, SkillInfographicChip } from './_character_skills'

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
          color={chip.moneyAmount > 0 ? 'emerald' : 'muted'}
          prefix="+"
          className="inline-flex"
        />
      ) : (
        <span className={`font-bold tabular-nums ${valueTone}`}>{chip.value}</span>
      )}
    </span>
  )
}

interface SkillBonusInfographicProps {
  skill: CharacterSkill
  className?: string
}

export function SkillBonusInfographic({ skill, className = '' }: SkillBonusInfographicProps) {
  if (skill.id === 'property_slots' || skill.infographic.length === 0) {
    return <div className={className} />
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${className}`}
      aria-label="Бонусы текущего уровня"
    >
      {skill.infographic.map((chip) => (
        <InfographicChip key={chip.id} chip={chip} />
      ))}
    </div>
  )
}
