import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
} from '@floating-ui/react'
import { useMemo, useState, type ReactNode } from 'react'
import {
  BankIcon,
  RealEstateIcon,
  ShieldInsiderIcon,
  StarIcon,
  TradingChartIcon,
} from '../../../../shared/icons'
import { useGameStore } from '../../../../stores/game.store'
import { formatReputation } from '../../_model/utils'
import { TRADING_GRADES, getSkillLevel } from '../character/_character_skills'
import type { CharacterSkill } from '../character/_character_skills'
import './_header_stats.css'

type HeaderStatVariant = 'reputation' | 'trading' | 'insider' | 'realty' | 'bank'

interface HeaderStatConfig {
  variant: HeaderStatVariant
  icon: ReactNode
  value: ReactNode
  title: string
  description: string
  valueClassName?: string
  badgeClassName?: string
}

function getHighestAccessibleGrade(raw: string): string {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  return parts[parts.length - 1] ?? 'F'
}

function getBankingInfographicValue(skills: CharacterSkill[], chipId: string): string | null {
  const bankingSkill = skills.find((skill) => skill.id === 'banking')
  const chip = bankingSkill?.infographic.find((item) => item.id === chipId)
  return chip?.value ?? null
}

function getBankingGrade(skills: CharacterSkill[]): string {
  const level = getSkillLevel(skills, 'banking')
  const index = Math.min(Math.max(0, level - 1), TRADING_GRADES.length - 1)
  return TRADING_GRADES[index]
}

function HeaderStatItem({
  variant,
  icon,
  value,
  title,
  description,
  valueClassName = '',
  badgeClassName = '',
}: HeaderStatConfig) {
  const [open, setOpen] = useState(false)
  const useBadge = variant === 'trading' || variant === 'realty' || variant === 'bank'

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'bottom',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip(), shift({ padding: 8 })],
  })

  const hover = useHover(context, { move: false, delay: { open: 120, close: 80 } })
  const focus = useFocus(context)
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  return (
    <>
      <div
        ref={refs.setReference}
        tabIndex={0}
        className={`header-stats__item header-stats__item--${variant}`}
        aria-label={`${title}: ${typeof value === 'string' ? value : ''}. ${description}`}
        {...getReferenceProps()}
      >
        <span className="header-stats__icon" aria-hidden>
          {icon}
        </span>

        {useBadge ? (
          <span className={`header-stats__badge ${badgeClassName}`}>{value}</span>
        ) : (
          <span className={`header-stats__value ${valueClassName}`}>{value}</span>
        )}
      </div>

      {open ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles, zIndex: 200 }}
            className="header-stats__tooltip"
            {...getFloatingProps()}
          >
            <p className="header-stats__tooltip-title">{title}</p>
            <p>{description}</p>
          </div>
        </FloatingPortal>
      ) : null}
    </>
  )
}

export function HeaderStats() {
  const reputation = useGameStore((state) => state.characterProfile.reputation)
  const stats = useGameStore((state) => state.characterStats)
  const skills = useGameStore((state) => state.characterSkills)

  const bankingGrade = useMemo(() => getBankingGrade(skills), [skills])

  const propertyGrade = useMemo(() => {
    const raw = getBankingInfographicValue(skills, 'property-deals') ?? 'F'
    return getHighestAccessibleGrade(raw)
  }, [skills])

  const items: HeaderStatConfig[] = [
    {
      variant: 'reputation',
      icon: <StarIcon className="h-3.5 w-3.5 text-amber-400" />,
      value: formatReputation(reputation),
      title: `Репутация: ${formatReputation(reputation)}`,
      description: 'Доверие рынка к вам. Чем выше репутация, тем лучше условия сделок.',
      valueClassName: 'text-amber-300',
    },
    {
      variant: 'trading',
      icon: <TradingChartIcon className="h-3.5 w-3.5 text-cyan-400" />,
      value: stats.tradingGrade,
      title: `Доступный ранг акций: ${stats.tradingGrade}`,
      description:
        'Грейд торгового навыка от F до A. Открывает доступ к более дорогим акциям.',
      badgeClassName: 'border-cyan-500/30 bg-cyan-500/12 text-cyan-200',
    },
    {
      variant: 'insider',
      icon: <ShieldInsiderIcon className="h-3.5 w-3.5 text-violet-300" />,
      value: `${stats.insiderChancePercent}%`,
      title: `Шанс инсайда: ${stats.insiderChancePercent}%`,
      description:
        'Вероятность получить инсайдерскую новость. +2% за каждый уровень карьеры, максимум 30%.',
      valueClassName: 'text-emerald-200',
    },
    {
      variant: 'realty',
      icon: <RealEstateIcon className="h-3.5 w-3.5 text-emerald-400" />,
      value: propertyGrade,
      title: `Доступный ранг недвижимости: ${propertyGrade}`,
      description:
        'Текущая доступная категория выгодных предложений на рынке недвижимости.',
      badgeClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200',
    },
    {
      variant: 'bank',
      icon: <BankIcon className="h-3.5 w-3.5 text-sky-400" />,
      value: bankingGrade,
      title: `Банковский ранг: ${bankingGrade}`,
      description: `Грейд навыка Banking. Ставка по кредиту: ${stats.bankBaseRatePercent}%.`,
      badgeClassName: 'border-sky-500/30 bg-sky-500/12 text-sky-200',
    },
  ]

  return (
    <nav className="header-stats" aria-label="Ключевые параметры персонажа">
      {items.map((item) => (
        <HeaderStatItem key={item.variant} {...item} />
      ))}
    </nav>
  )
}
