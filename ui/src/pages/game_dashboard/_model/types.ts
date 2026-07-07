import type { ReactNode } from 'react';
import type { GeneratedNewsItem } from '../../../api/gameTurn';
import type { CreateGameBody } from '../../../api/types';
import type { GameDashboardThemeTokens } from '../_components/shared';

export type dashboard_tab =
  | 'character'
  | 'bank'
  | 'exchange'
  | 'otc'
  | 'real-estate'
  | 'news'
  | 'settings'

export interface portfolio_row {
  ticker: string
  name: string
  qty: number
  price: number
  changePct: number
  paysDividends?: boolean
  turnsUntilDividend?: number | null
  listingId?: string
  turnsHeldInCycle?: number
}

export interface news_item {
  id: string
  title: string
  body: string
  excerpt: string
  timeLabel: string
  kind?: GeneratedNewsItem['kind']
  hot?: boolean
  sentiment: 'positive' | 'negative' | 'neutral'
  ticker?: string
  publishedAt: string
  publishedStep?: number
  payload?: unknown
  turnsLeft?: number
  newsLevel?: number
}

export type bot_deal_side = 'buy' | 'sell'

export interface bot_deal {
  id: string
  botName: string
  avatarSrc?: string
  profession?: CreateGameBody['profession']
  ticker: string
  companyName: string
  side: bot_deal_side
  qty: number
  price: number
  turnsLeft: number
}

export type property_offer_type = 'BUY' | 'SELL'
export type profit_grade = 'F' | 'E' | 'D' | 'C' | 'B' | 'A'

export interface PropertyOffer {
  id: string
  assetId: string
  itemName: string
  inventoryItemId: string | null
  type: property_offer_type
  offerPrice: number
  marketPrice: number
  profitPercent: number
  profitGrade: profit_grade
  requiredBankingLevel: number
  isHot: boolean
  expiresInTurns: number
  isLocked: boolean
  downPaymentPercent: number
  pendingNegotiatedPrice: number | null
  pendingNegotiatedPercent: number | null
}

export interface sidebar_nav_item {
  id: dashboard_tab
  label: string
  shortLabel: string
  icon: ReactNode
}

export interface news_panel_props {
  news: news_item[]
  turn: number
  theme: GameDashboardThemeTokens
  onSelectNews: (item: news_item) => void
}
