import { createContext, useContext, type ReactNode } from 'react'
import type { dashboard_tab, news_item } from './types'

export interface DashboardUiContextValue {
  activeTab: dashboard_tab
  setActiveTab: (tab: dashboard_tab) => void
  selectNews: (item: news_item) => void
  openExitModal: () => void
  openNewsTab: () => void
  openRealEstateTab: (offerId?: string) => void
  openExchangeTab: (listingId?: string) => void
  highlightPropertyOfferId: string | null
  clearHighlightPropertyOffer: () => void
  highlightStockListingId: string | null
  clearHighlightStockListing: () => void
}

const DashboardUiContext = createContext<DashboardUiContextValue | null>(null)

export function DashboardUiProvider({
  value,
  children,
}: {
  value: DashboardUiContextValue
  children: ReactNode
}) {
  return <DashboardUiContext.Provider value={value}>{children}</DashboardUiContext.Provider>
}

export function useDashboardUi() {
  const context = useContext(DashboardUiContext)
  if (!context) {
    throw new Error('useDashboardUi must be used within DashboardUiProvider')
  }
  return context
}
