import type { CharacterDreamPreviewRequirement } from '../../../stores/characters.store'
import {
  BankIcon,
  BriefcaseIcon,
  CoinIcon,
  RealEstateIcon,
  StarIcon,
  TradingChartIcon,
} from '../../../shared/icons'
import { TRADING_GRADES } from '../../game_dashboard/_components/character/_character_skills'

function levelToGrade(level: number): string {
  return TRADING_GRADES[Math.max(0, Math.min(level - 1, TRADING_GRADES.length - 1))] ?? 'F'
}

function formatRequirementLabel(req: CharacterDreamPreviewRequirement): string {
  if (req.kind === 'banking') {
    const match = req.label.match(/(\d+)/)
    if (match) return req.label.replace(match[1], levelToGrade(Number(match[1])))
  }
  if (req.kind === 'trading') {
    const match = req.label.match(/(\d+)/)
    if (match) return req.label.replace(match[1], levelToGrade(Number(match[1])))
  }
  return req.label
}

function RequirementIcon({ kind }: { kind: CharacterDreamPreviewRequirement['kind'] }) {
  switch (kind) {
    case 'balance':
      return <CoinIcon className="h-3 w-3 shrink-0 text-amber-400/90" />
    case 'reputation':
      return <StarIcon className="h-3 w-3 shrink-0 text-amber-300/90" />
    case 'profession':
      return <BriefcaseIcon className="h-3 w-3 shrink-0 text-slate-300/85" />
    case 'portfolio':
      return <TradingChartIcon className="h-3 w-3 shrink-0 text-cyan-400/85" />
    case 'trading':
      return <TradingChartIcon className="h-3 w-3 shrink-0 text-violet-400/85" />
    case 'banking':
      return <BankIcon className="h-3 w-3 shrink-0 text-sky-400/85" />
    case 'passive':
      return <BankIcon className="h-3 w-3 shrink-0 text-emerald-400/85" />
    case 'property':
      return <RealEstateIcon className="h-3 w-3 shrink-0 text-indigo-400/85" />
    case 'no_installments':
      return <BankIcon className="h-3 w-3 shrink-0 text-rose-400/80" />
    default:
      return null
  }
}

export function normalizeRequirementPreview(
  raw: CharacterDreamPreviewRequirement | string,
): CharacterDreamPreviewRequirement {
  if (typeof raw === 'string') {
    if (raw.startsWith('Баланс')) return { kind: 'balance', label: raw }
    if (raw.startsWith('Профессия')) return { kind: 'profession', label: raw }
    if (raw.startsWith('Портфель')) return { kind: 'portfolio', label: raw }
    if (raw.startsWith('Банк')) return { kind: 'banking', label: raw }
    if (raw.startsWith('Трейдинг')) return { kind: 'trading', label: raw }
    if (raw.startsWith('Пассив')) return { kind: 'passive', label: raw }
    if (raw.startsWith('Репутация')) return { kind: 'reputation', label: raw }
    if (raw === 'Без рассрочек') return { kind: 'no_installments', label: raw }
    return { kind: 'property', label: raw }
  }
  return raw
}

export function DreamRequirementChip({ requirement }: { requirement: CharacterDreamPreviewRequirement | string }) {
  const req = normalizeRequirementPreview(requirement)
  const label = formatRequirementLabel(req)

  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-slate-600/40 bg-slate-900/50 px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-slate-200/95">
      <RequirementIcon kind={req.kind} />
      <span>{label}</span>
    </span>
  )
}
