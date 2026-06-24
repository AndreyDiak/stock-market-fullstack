import { calcPropertyPassiveIncome, type PropertySlot } from '../../../components/game_dashboard/property_inventory_block'
import type { bot_deal_side, news_item, portfolio_row } from './types'

export function format_change(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
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

export function bot_deal_action_label(side: bot_deal_side) {
  return side === 'buy' ? 'Продать' : 'Купить'
}

export function format_turns_left_label(turnsLeft: number) {
  if (turnsLeft === 1) return '1 ход'
  const mod10 = turnsLeft % 10
  const mod100 = turnsLeft % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${turnsLeft} хода`
  return `${turnsLeft} ходов`
}
