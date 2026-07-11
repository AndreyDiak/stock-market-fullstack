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
import { formatMoney } from '../../../../components/money/money_value'
import {
  BankIcon,
  BriefcaseIcon,
  CoinIcon,
  RealEstateIcon,
  StarIcon,
  TradingChartIcon,
} from '../../../../shared/icons'
import { useGameStore } from '../../../../stores/game.store'
import { formatReputation } from '../../_model/utils'
import {
  calcSellCommissionPercent,
  getMaxNegotiateDiscountPercent,
  getSkillLevel,
  type CharacterSkill,
} from '../character/_character_skills'
import './_header_stats.css'

type HeaderStatVariant = 'reputation' | 'work' | 'bank' | 'trading' | 'realty'

interface HeaderStatConfig {
  variant: HeaderStatVariant
  icon: ReactNode
  value: ReactNode
  title: string
  description: string
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

function countOccupiedPropertySlots(
  slots: { isLocked: boolean; item?: unknown }[],
) {
  return slots.filter((slot) => !slot.isLocked && slot.item).length
}

function HeaderStatItem({
  variant,
  icon,
  value,
  title,
  description,
  badgeClassName = '',
}: HeaderStatConfig) {
  const [open, setOpen] = useState(false)

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
        aria-label={`${title}. ${description}`}
        {...getReferenceProps()}
      >
        <span className="header-stats__icon" aria-hidden>
          {icon}
        </span>

        <span className={`header-stats__badge ${badgeClassName}`}>{value}</span>
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
  const propertySlots = useGameStore((state) => state.propertySlots)

  const propertyDealGrade = useMemo(() => {
    const raw = getBankingInfographicValue(skills, 'property-deals') ?? 'F'
    return getHighestAccessibleGrade(raw)
  }, [skills])

  const tradingLevel = useMemo(() => getSkillLevel(skills, 'trading'), [skills])
  const sellCommissionPercent = stats.sellCommissionPercent ?? calcSellCommissionPercent(tradingLevel)
  const negotiateDiscountPercent = useMemo(
    () => getMaxNegotiateDiscountPercent(tradingLevel),
    [tradingLevel],
  )

  const occupiedPropertySlots = useMemo(
    () => countOccupiedPropertySlots(propertySlots),
    [propertySlots],
  )
  const totalPropertySlots = propertySlots.length

  const items: HeaderStatConfig[] = [
    {
      variant: 'reputation',
      icon: <StarIcon className="h-3.5 w-3.5 text-amber-400" />,
      value: formatReputation(reputation),
      title: `Репутация: ${formatReputation(reputation)}`,
      description: 'Доверие рынка к вам. Чем выше репутация, тем лучше условия сделок.',
      badgeClassName: 'border-amber-500/30 bg-amber-500/12 text-amber-200',
    },
    {
      variant: 'work',
      icon: <BriefcaseIcon className="h-3.5 w-3.5 text-emerald-400" />,
      value: (
        <span className="inline-flex items-center gap-0.5">
          <span>{formatMoney(stats.salaryBonus)}</span>
          <CoinIcon className="h-3 w-3 shrink-0" aria-hidden />
          <span>/{stats.insiderChancePercent}%</span>
        </span>
      ),
      title: 'Карьера',
      description: `Бонус к зарплате: +${formatMoney(stats.salaryBonus)}. Шанс получить инсайд: ${stats.insiderChancePercent}%.`,
      badgeClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200',
    },
    {
      variant: 'bank',
      icon: <BankIcon className="h-3.5 w-3.5 text-sky-400" />,
      value: `${propertyDealGrade}/${stats.bankBaseRatePercent}%`,
      title: 'Банк',
      description: `Лучшая доступная сделка с имуществом: грейд ${propertyDealGrade}. Ставка по кредиту: ${stats.bankBaseRatePercent}%.`,
      badgeClassName: 'border-sky-500/30 bg-sky-500/12 text-sky-200',
    },
    {
      variant: 'trading',
      icon: <TradingChartIcon className="h-3.5 w-3.5 text-cyan-400" />,
      value: `${stats.tradingGrade}/${sellCommissionPercent}%`,
      title: 'Трейдинг',
      description: `Грейд акций: ${stats.tradingGrade}. Комиссия при продаже: ${sellCommissionPercent}%. Торг по имуществу: до ${negotiateDiscountPercent}%.`,
      badgeClassName: 'border-cyan-500/30 bg-cyan-500/12 text-cyan-200',
    },
    {
      variant: 'realty',
      icon: <RealEstateIcon className="h-3.5 w-3.5 text-emerald-400" />,
      value: `${occupiedPropertySlots}/${totalPropertySlots}`,
      title: 'Имущество',
      description: `Занято слотов: ${occupiedPropertySlots} из ${totalPropertySlots}.`,
      badgeClassName: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-200',
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
