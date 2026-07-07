import { calcPropertyPassiveIncome, type PropertySlot } from '../_components/property';
import type { bot_deal_side, news_item, portfolio_row } from './types';

import { SALARY_CYCLE_TURNS } from './constants';

export function turnsUntilSalary(step: number): number {
  const remainder = step % SALARY_CYCLE_TURNS
  if (remainder === 0) return 0
  return SALARY_CYCLE_TURNS - remainder
}

export function format_change(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function roundReputation(value: number): number {
  return Math.round(value * 10) / 10
}

export function formatReputation(value: number): string {
  return roundReputation(value).toFixed(1)
}

export function calc_passive_income(slots: PropertySlot[]) {
  return calcPropertyPassiveIncome(slots)
}

export function calc_portfolio_stats(portfolio: portfolio_row[]) {
  const totalValue = portfolio.reduce((sum, row) => sum + row.qty * row.price, 0)
  const todayProfit = portfolio.reduce(
    (sum, row) => sum + row.qty * row.price * (row.changePct / 100),
    0,
  )
  return { totalValue, todayProfit }
}

export function news_border_class(sentiment: news_item['sentiment']) {
  if (sentiment === 'positive') return 'border-l-emerald-500'
  if (sentiment === 'negative') return 'border-l-red-500'
  return 'border-l-slate-500'
}

export function is_insider_news(item: news_item) {
  return item.kind === 'INSIDER'
}

export function is_active_insider(item: news_item, currentStep: number) {
  return is_insider_news(item) && get_insider_turns_left(item, currentStep) != null
}

export function get_insider_turns_left(item: news_item, currentStep: number) {
  const payload = item.payload as {
    turnsUntilImpact?: number
    scheduledImpact?: { triggerAtStep: number; turnsUntilImpact?: number }
  } | undefined

  const triggerAtStep = payload?.scheduledImpact?.triggerAtStep
  if (triggerAtStep != null) {
    const left = triggerAtStep - currentStep
    return left > 0 ? left : null
  }

  const publishedStep = item.publishedStep
  const turnsUntilImpact =
    payload?.turnsUntilImpact ?? payload?.scheduledImpact?.turnsUntilImpact

  if (publishedStep != null && turnsUntilImpact != null) {
    const left = publishedStep + turnsUntilImpact - currentStep
    return left > 0 ? left : null
  }

  return null
}

export function find_pinned_insider(
  news: news_item[],
  currentStep: number,
): news_item | null {
  const activeInsiders = news
    .filter((item) => is_active_insider(item, currentStep))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )

  return activeInsiders[0] ?? null
}

export function has_active_insider_alert(
  news: news_item[],
  currentStep: number,
): boolean {
  return find_pinned_insider(news, currentStep) != null
}

export function sort_news_for_panel(news: news_item[], currentStep: number) {
  const visible = filter_visible_news(news, currentStep)
  const pinned = find_pinned_insider(visible, currentStep)
  const sorted = [...visible].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )
  if (!pinned) return sorted
  return [pinned, ...sorted.filter((item) => item.id !== pinned.id)]
}

export function find_latest_market_news(
  news: news_item[],
  currentStep?: number,
): news_item | null {
  const visible = currentStep != null ? filter_visible_news(news, currentStep) : news

  return (
    [...visible]
      .filter((item) => item.kind === 'MARKET')
      .sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
      )[0] ?? null
  )
}

export function get_latest_news(news: news_item[], count = 2, currentStep?: number) {
  const visible =
    currentStep != null ? filter_visible_news(news, currentStep) : news
  const sorted = [...visible].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  )

  return sorted.slice(0, count)
}

export function remap_news_for_step(news: news_item[], currentStep: number) {
  return news.map((item) => ({
    ...item,
    turnsLeft: get_insider_turns_left(item, currentStep) ?? undefined,
    timeLabel: format_news_age_label(item.publishedStep, currentStep),
  }))
}

export function merge_news_items(
  incoming: news_item[],
  existing: news_item[],
  currentStep: number,
  limit = 20,
) {
  const byId = new Map<string, news_item>()
  for (const item of [...incoming, ...existing]) {
    byId.set(item.id, item)
  }

  return filter_visible_news(
    remap_news_for_step(
      [...byId.values()]
        .sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        )
        .slice(0, limit),
      currentStep,
    ),
    currentStep,
  )
}

export function bot_deal_action_label(side: bot_deal_side) {
  return side === 'buy' ? 'Продать' : 'Купить'
}

export function format_turns_ago_label(turnsAgo: number) {
  if (turnsAgo <= 0) return 'этот ход'
  if (turnsAgo > 10) return 'давно'
  if (turnsAgo > 5) return 'недавно'
  const mod10 = turnsAgo % 10
  const mod100 = turnsAgo % 100
  if (mod10 === 1 && mod100 !== 11) return `${turnsAgo} ход назад`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${turnsAgo} хода назад`
  }
  return `${turnsAgo} ходов назад`
}

export function resolve_published_step(item: {
  publishedStep?: number
  payload?: unknown
}): number | undefined {
  if (item.publishedStep != null) return item.publishedStep
  const fromPayload = (item.payload as { publishedStep?: number } | undefined)?.publishedStep
  return typeof fromPayload === 'number' ? fromPayload : undefined
}

export function format_news_age_label(
  publishedStep: number | undefined,
  currentStep: number,
): string {
  if (publishedStep == null) return '—'
  return format_turns_ago_label(currentStep - publishedStep)
}

export function format_turns_left_label(turnsLeft: number) {
  const mod10 = turnsLeft % 10
  const mod100 = turnsLeft % 100
  if (mod10 === 1 && mod100 !== 11) return `${turnsLeft} ход`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${turnsLeft} хода`
  return `${turnsLeft} ходов`
}

export function format_turn_step_label(step: number) {
  return `ход ${step}`
}

export function format_turns_remaining_label(turnsLeft: number) {
  return `ещё ${format_turns_left_label(turnsLeft)}`
}

export function format_insider_relevance_label(turnsLeft: number) {
  return `актуален ещё ${format_turns_left_label(turnsLeft)}`
}

export function filter_visible_news(news: news_item[], currentStep: number) {
  return news.filter(
    (item) => !is_insider_news(item) || is_active_insider(item, currentStep),
  )
}
