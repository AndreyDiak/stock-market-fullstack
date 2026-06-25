import type { SkillUpgradeBenefit } from './character_skills'

const TONE_CLASSES = {
  muted: 'text-slate-400 tabular-nums',
  emerald: 'font-semibold text-emerald-400 tabular-nums',
  amber: 'font-semibold text-amber-400 tabular-nums',
} as const

function AccentValue({
  value,
  tone = 'emerald',
}: {
  value: string
  tone?: keyof typeof TONE_CLASSES
}) {
  return <span className={TONE_CLASSES[tone]}>{value}</span>
}

export function SkillUpgradeBenefitLine({ benefit }: { benefit: SkillUpgradeBenefit }) {
  if (benefit.kind === 'text' && benefit.text) {
    return <span className="text-slate-200">{benefit.text}</span>
  }

  if (benefit.kind === 'bonus') {
    return (
      <span className="text-slate-200">
        {benefit.label}{' '}
        <AccentValue value={benefit.highlight ?? ''} tone={benefit.toTone ?? 'amber'} />
      </span>
    )
  }

  if (benefit.kind === 'compare' && benefit.from != null && benefit.to != null) {
    return (
      <span className="text-slate-200">
        {benefit.label}{' '}
        <AccentValue value={benefit.from} tone={benefit.fromTone ?? 'muted'} />
        <span className="text-slate-500"> → </span>
        <AccentValue value={benefit.to} tone={benefit.toTone ?? 'emerald'} />
        {benefit.suffix ? (
          <span className="text-slate-400"> {benefit.suffix}</span>
        ) : null}
      </span>
    )
  }

  return null
}
