import type { ReactNode } from 'react'
import type { DreamStageRequirement } from '../../../../api/dreams'
import {
  BankIcon,
  BriefcaseIcon,
  CoinIcon,
  RealEstateIcon,
  StarIcon,
  TradingChartIcon,
} from '../../../../shared/icons'
import type { dashboard_tab } from '../../_model/types'
import { TRADING_GRADES } from '../character/_character_skills'

const GRADES = TRADING_GRADES

function levelToGrade(level: number): string {
  return GRADES[Math.max(0, Math.min(level - 1, GRADES.length - 1))] ?? 'F'
}

export type PlayerState = {
  balance: number
  portfolioValue: number
  reputation: number
  tradingLevel: number
  professionLevel: number
  bankingLevel: number
  inventoryRefs: string[]
  inventoryPaymentPct: Record<string, number>
  hasActiveInstallments: boolean
}

export type RequirementMeta = {
  key: string
  label: string
  icon: ReactNode
  value: string
  met: boolean
  progress?: { current: number; target: number }
  displayFormat?: 'number' | 'grade'
}

export function getRequirementMetas(req: DreamStageRequirement, player: PlayerState): RequirementMeta[] {
  const metas: RequirementMeta[] = []
  if (req.minBalance !== undefined) {
    const met = player.balance >= req.minBalance
    metas.push({
      key: 'balance',
      label: 'Баланс',
      icon: <CoinIcon className="h-3.5 w-3.5 text-amber-400/80" />,
      value: player.balance.toLocaleString('ru-RU'),
      met,
      progress: { current: player.balance, target: req.minBalance },
    })
  }
  if (req.minPortfolioValue !== undefined) {
    const met = player.portfolioValue >= req.minPortfolioValue
    metas.push({
      key: 'portfolio',
      label: 'Портфель акций',
      icon: <TradingChartIcon className="h-3.5 w-3.5 text-cyan-400/80" />,
      value: player.portfolioValue.toLocaleString('ru-RU'),
      met,
      progress: { current: player.portfolioValue, target: req.minPortfolioValue },
    })
  }
  if (req.minPassiveIncome !== undefined) {
    const met = false
    metas.push({
      key: 'passive',
      label: 'Пассивный доход',
      icon: <BankIcon className="h-3.5 w-3.5 text-emerald-400/80" />,
      value: `0 / ход`,
      met,
      progress: { current: 0, target: req.minPassiveIncome },
    })
  }
  if (req.minReputation !== undefined) {
    const met = player.reputation >= req.minReputation
    metas.push({
      key: 'reputation',
      label: 'Репутация',
      icon: <StarIcon className="h-3.5 w-3.5 text-amber-400/80" />,
      value: player.reputation.toFixed(1),
      met,
      progress: { current: player.reputation, target: req.minReputation },
    })
  }
  if (req.minTradingLevel !== undefined) {
    const met = player.tradingLevel >= req.minTradingLevel
    metas.push({
      key: 'trading',
      label: 'Уровень трейдинга',
      icon: <TradingChartIcon className="h-3.5 w-3.5 text-violet-400/80" />,
      value: levelToGrade(player.tradingLevel),
      met,
      progress: { current: player.tradingLevel, target: req.minTradingLevel },
      displayFormat: 'grade',
    })
  }
  if (req.minBankingLevel !== undefined) {
    const met = player.bankingLevel >= req.minBankingLevel
    metas.push({
      key: 'banking',
      label: 'Банковское дело',
      icon: <BankIcon className="h-3.5 w-3.5 text-sky-400/80" />,
      value: levelToGrade(player.bankingLevel),
      met,
      progress: { current: player.bankingLevel, target: req.minBankingLevel },
      displayFormat: 'grade',
    })
  }
  if (req.minProfessionLevel !== undefined) {
    const met = player.professionLevel >= req.minProfessionLevel
    metas.push({
      key: 'profession',
      label: 'Уровень профессии',
      icon: <BriefcaseIcon className="h-3.5 w-3.5 text-slate-400/80" />,
      value: `${player.professionLevel}`,
      met,
      progress: { current: player.professionLevel, target: req.minProfessionLevel },
    })
  }
  if (req.requiredItems?.length) {
    const items = req.requireItemFullyOwned?.length ? req.requireItemFullyOwned : req.requiredItems
    const avgPct = Math.round(
      items.reduce((sum, ref) => sum + (player.inventoryPaymentPct[ref] ?? 0), 0) / items.length,
    )
    const fullyOwned = items.filter((ref) => (player.inventoryPaymentPct[ref] ?? 0) >= 100)
    const met = fullyOwned.length >= items.length
    const display = items.length === 1
      ? `${Math.min(100, avgPct)}%`
      : `${fullyOwned.length} / ${items.length}`
    metas.push({
      key: 'items',
      label: formatReqItem(items[0]) + (items.length > 1 ? ` +${items.length - 1}` : ''),
      icon: <RealEstateIcon className="h-3.5 w-3.5 text-indigo-400/80" />,
      value: display,
      met,
      progress: { current: avgPct, target: 100 },
    })
  }
  if (req.noActiveInstallments) {
    const met = !player.hasActiveInstallments
    metas.push({
      key: 'no-debt',
      label: 'Нет активных рассрочек',
      icon: <BankIcon className="h-3.5 w-3.5 text-red-400/80" />,
      value: met ? 'Нет долгов' : 'Есть долги',
      met,
    })
  }
  return metas
}

export function formatReqItem(item: string): string {
  const names: Record<string, string> = {
    warehouse: 'Склад',
    apartment: 'Квартира',
    car: 'Автомобиль',
    penthouse: 'Пентхаус',
    sport_car: 'Спорткар',
    country_house: 'Дом в деревне',
    garage: 'Гараж',
    tractor: 'Трактор',
    yacht: 'Яхта',
    boat: 'Лодка',
    trip: 'Кругосветка',
    hiking_ticket: 'Билет в поход',
    collectible_card: 'Коллекционная карточка',
    expensive_painting: 'Картина',
    combine_harvester: 'Комбайн',
    trade_pavilion: 'Торговый павильон',
    car_wash: 'Автомойка',
  }
  return names[item] ?? item
}

type CtaAction = {
  label: string
  tab: dashboard_tab
  icon: ReactNode
}

export function getActionsForRequirement(req: DreamStageRequirement): CtaAction[] {
  const seen = new Set<dashboard_tab>()
  const actions: CtaAction[] = []

  if (req.minBalance !== undefined && !seen.has('bank')) {
    seen.add('bank')
    actions.push({ label: 'Пополнить счёт', tab: 'bank', icon: <CoinIcon className="h-3.5 w-3.5" /> })
  }
  if (req.minPortfolioValue !== undefined && !seen.has('exchange')) {
    seen.add('exchange')
    actions.push({ label: 'Купить акции', tab: 'exchange', icon: <TradingChartIcon className="h-3.5 w-3.5" /> })
  }
  if ((req.minPassiveIncome !== undefined || (req.requiredItems?.length ?? 0) > 0) && !seen.has('real-estate')) {
    seen.add('real-estate')
    actions.push({ label: 'Недвидимость', tab: 'real-estate', icon: <RealEstateIcon className="h-3.5 w-3.5" /> })
  }
  if ((req.minReputation !== undefined || req.minTradingLevel !== undefined) && !seen.has('deals')) {
    seen.add('deals')
    actions.push({ label: 'Сделки', tab: 'deals', icon: <StarIcon className="h-3.5 w-3.5" /> })
  }
  if (req.noActiveInstallments && !seen.has('bank')) {
    seen.add('bank')
    actions.push({ label: 'Погасить рассрочки', tab: 'bank', icon: <BankIcon className="h-3.5 w-3.5" /> })
  }

  return actions
}

export function isAllMet(metas: RequirementMeta[]): boolean {
  return metas.length > 0 && metas.every((m) => m.met)
}
