import type { news_item } from '../../_model/types'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { GameButton } from '../../../../components/game_ui/game_button'
import type { GameDashboardThemeTokens } from '../shared'

interface StockNewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
  turn?: number
}

export function StockNewsCard({ item }: StockNewsCardProps) {
  const stockListings = useGameStore((state) => state.stockListings)
  const { openExchangeTab } = useDashboardUi()

  return (
    <div className="news-stock">
      <h4 className="news-stock__title">{item.title}</h4>
      <p className="news-stock__description">{item.body}</p>

      {item.ticker ? (
        <div className="news-stock__actions">
          <GameButton
            size="sm"
            variant="teal"
            onClick={(e) => {
              e.stopPropagation()
              const listing = stockListings.find((row) => row.ticker === item.ticker)
              openExchangeTab(listing?.id)
            }}
          >
            Открыть на бирже
          </GameButton>
          {item.ticker ? (
            <span className="news-stock__ticker-label">{item.ticker}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
