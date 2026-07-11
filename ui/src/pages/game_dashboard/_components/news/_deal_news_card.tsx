import type { news_item } from '../../_model/types'
import type { GameDashboardThemeTokens } from '../shared'

interface DealNewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
}

export function DealNewsCard({ item }: DealNewsCardProps) {
  return (
    <div className="news-deal">
      <h4 className="news-deal__title">{item.title}</h4>
      <p className="news-deal__description">{item.body}</p>
    </div>
  )
}
