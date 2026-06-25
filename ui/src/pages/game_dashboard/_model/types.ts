import type { ReactNode } from 'react';
import type { GeneratedNewsItem } from '../../../api/gameTurn';
import type { CreateGameBody } from '../../../api/types';
import type { GameColorTheme } from '../../../stores/game_settings.store';
import type { ActiveLoan, BankSummary } from '../_components/bank_view';
import type { CharacterProfile, CharacterUpgrade } from '../_components/character_profile_panel';
import type { GameDashboardThemeTokens } from '../_components/game_dashboard_theme';
import type { buildNextTurnForecast } from '../_components/next_turn_forecast';
import type { PropertySlot } from '../_components/property_inventory_block';

export type dashboard_tab =
  | 'character'
  | 'bank'
  | 'exchange'
  | 'otc'
  | 'real-estate'
  | 'settings'

export interface portfolio_row {
  ticker: string
  name: string
  qty: number
  price: number
  changePct: number
}

export interface news_item {
  id: string
  title: string
  excerpt: string
  timeLabel: string
  kind?: GeneratedNewsItem['kind']
  hot?: boolean
  sentiment: 'positive' | 'negative' | 'neutral'
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

export interface sidebar_nav_item {
  id: dashboard_tab
  label: string
  shortLabel: string
  icon: ReactNode
}

export interface header_props {
  turn: number
  balance: number
  passiveIncome: number
  reputation: number
  tradingLevel: number
  onEndTurn: () => void
  endingTurn?: boolean
  theme: GameDashboardThemeTokens
}

export interface left_sidebar_props {
  activeTab: dashboard_tab
  onTabChange: (tab: dashboard_tab) => void
  theme: GameDashboardThemeTokens
  onOpenExit: () => void
}

export interface center_panel_props {
  activeTab: dashboard_tab
  portfolio: portfolio_row[]
  otcDeals: bot_deal[]
  onOtcDealAccept: (id: string) => void
  onOtcDealDecline: (id: string) => void
  characterProfile: CharacterProfile
  characterUpgrades: CharacterUpgrade[]
  balance: number
  onBalanceChange: (next: number) => void
  onPurchaseUpgrade: (upgradeId: string) => void
  bankSummary: BankSummary
  bankLoans: ActiveLoan[]
  onLoanPayOff: (loanId: string) => void
  creditRating: string
  theme: GameDashboardThemeTokens
  dynamicBackground: boolean
  colorTheme: GameColorTheme
  onDynamicBackgroundChange: (value: boolean) => void
  onColorThemeChange: (value: GameColorTheme) => void
}

export interface right_panel_props {
  news: news_item[]
  nextTurnForecast: ReturnType<typeof buildNextTurnForecast>
  careerLevel: number
  salary: number
  turnsUntilSalary: number
  propertySlots: PropertySlot[]
  theme: GameDashboardThemeTokens
}
