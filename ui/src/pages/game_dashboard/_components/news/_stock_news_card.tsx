import type { news_item } from '../../_model/types'
import type { GameDashboardThemeTokens } from '../shared'

interface StockNewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
  turn?: number
}

export function StockNewsCard({ item }: StockNewsCardProps) {
  return (
    <div className="news-stock">
      <h4 className="news-stock__title">{item.title}</h4>
      <p className="news-stock__description">{item.body}</p>
    </div>
  )
}
