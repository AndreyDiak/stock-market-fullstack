import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import type { Game } from '../../api/types'
import { GameShell } from '../../components/game_ui/game_shell'
import { useGameBackgroundMusic } from '../../hooks/use_game_background_music'
import { useGameSettingsStore } from '../../stores/game_settings.store'
import { useGameStore } from '../../stores/game.store'
import { BackgroundEffects } from './_components/layout/_background_effects'
import './_components/shared/_dashboard_tokens.css'
import { CenterPanel } from './_components/layout'
import { Header } from './_components/layout/_header'
import { LeftSidebar } from './_components/layout/_left_sidebar'
import { RightPanel } from './_components/layout/_right_panel'
import { ExitGameModal } from './_components/layout/_exit_game_modal'
import { NewsNewspaperModal } from './_components/news/_news_newspaper_modal'
import { useDashboardTheme } from './_model/use_dashboard_theme'
import { DashboardUiProvider } from './_model/dashboard_ui_context'
import {
  applyDashboardTabSearchParam,
  isDashboardTab,
  parseDashboardTab,
  DASHBOARD_TAB_SEARCH_PARAM,
} from './_model/_dashboard_tab_search'
import type { dashboard_tab, news_item } from './_model/types'

export function GameDashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const gameId = searchParams.get('id')
  const initialGame = (location.state as { initialGame?: Game } | null)?.initialGame

  const { dynamicBackground, colorTheme, sidebarCollapsed } = useGameSettingsStore()
  const loading = useGameStore((state) => state.loading)
  const init = useGameStore((state) => state.init)
  const reset = useGameStore((state) => state.reset)

  const dashboardTheme = useDashboardTheme()

  const activeTab = parseDashboardTab(searchParams)

  const setActiveTab = useCallback(
    (tab: dashboard_tab) => {
      setSearchParams((prev) => applyDashboardTabSearchParam(prev, tab), { replace: true })
    },
    [setSearchParams],
  )
  const [exitModalOpen, setExitModalOpen] = useState(false)
  const [selectedNews, setSelectedNews] = useState<news_item | null>(null)
  const [highlightPropertyOfferId, setHighlightPropertyOfferId] = useState<string | null>(null)
  const [highlightStockListingId, setHighlightStockListingId] = useState<string | null>(null)
  const [highlightNewsId, setHighlightNewsId] = useState<string | null>(null)

  const dashboardUi = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      selectNews: (item: news_item) => setSelectedNews(item),
      openExitModal: () => setExitModalOpen(true),
      openNewsTab: () => setActiveTab('news'),
      openRealEstateTab: (offerId?: string) => {
        setActiveTab('real-estate')
        setHighlightPropertyOfferId(offerId ?? null)
      },
      openExchangeTab: (listingId?: string) => {
        setActiveTab('exchange')
        setHighlightStockListingId(listingId ?? null)
      },
      highlightPropertyOfferId,
      clearHighlightPropertyOffer: () => setHighlightPropertyOfferId(null),
      highlightStockListingId,
      clearHighlightStockListing: () => setHighlightStockListingId(null),
      highlightNewsId,
      setHighlightNewsId,
      clearHighlightNews: () => setHighlightNewsId(null),
    }),
    [activeTab, highlightPropertyOfferId, highlightStockListingId, highlightNewsId, setActiveTab],
  )

  useEffect(() => {
    if (!gameId) {
      navigate('/slots', { replace: true })
      return
    }
    void init(gameId, initialGame)
    return () => {
      reset()
    }
  }, [gameId, initialGame, init, reset, navigate])

  useEffect(() => {
    const tabParam = searchParams.get(DASHBOARD_TAB_SEARCH_PARAM)
    if (tabParam != null && !isDashboardTab(tabParam)) {
      setSearchParams((prev) => applyDashboardTabSearchParam(prev, activeTab), { replace: true })
    }
  }, [searchParams, activeTab, setSearchParams])

  const closeNews = useCallback(() => setSelectedNews(null), [])

  useGameBackgroundMusic(!loading)

  return (
    <DashboardUiProvider value={dashboardUi}>
      <GameShell
        fixedHeight
        showAtmosphere={dynamicBackground}
        colorTheme={colorTheme}
        className={dashboardTheme.shellClass}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center p-4">
            <p className={`text-sm ${dashboardTheme.secondaryText}`}>Загрузка игры...</p>
          </div>
        ) : (
          <div
            className={`dashboard-root relative mx-auto flex h-full max-w-[100rem] flex-col gap-4 overflow-hidden p-3 md:p-4${
              sidebarCollapsed ? ' dashboard-root--sidebar-collapsed' : ''
            }`}
          >
            {dynamicBackground && <BackgroundEffects />}

            <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-4">
              <Header />

              <div className="dashboard min-h-0 flex-1">
                <div className="dashboard__sidebar dashboard-column-scrim flex h-full min-h-0 flex-col">
                  <LeftSidebar />
                </div>
                <div className="dashboard__center dashboard-column-scrim">
                  <CenterPanel />
                </div>
                <div className="dashboard__right dashboard-column-scrim">
                  <RightPanel />
                </div>
              </div>
            </div>
          </div>
        )}

        <NewsNewspaperModal item={selectedNews} onClose={closeNews} />

        <ExitGameModal
          open={exitModalOpen}
          theme={dashboardTheme}
          onCancel={() => setExitModalOpen(false)}
          onConfirm={() => navigate('/slots')}
        />
      </GameShell>
    </DashboardUiProvider>
  )
}
