import { useGameStore } from '../../../../stores/game.store'
import { filter_visible_news } from '../../_model/utils'
import {
  NEWS_CATEGORY_CONFIG,
  resolveNewsCycleState,
} from '../news/_news_category'

export function HeaderNextNewsPreview() {
  const news = useGameStore((state) => state.news)
  const turn = useGameStore((state) => state.turn)
  const visibleNews = filter_visible_news(news, turn)
  const { nextType } = resolveNewsCycleState(visibleNews)
  const config = NEWS_CATEGORY_CONFIG[nextType]
  const Icon = config.Icon

  return (
    <div
      className="header__next-news"
      title={`На следующем ходе: ${config.label.toLowerCase()}`}
      aria-label={`Следующая новость: ${config.label}`}
    >
      <span className={`header__next-news-chip ${config.chipClass}`}>
        <Icon className="header__next-news-icon" aria-hidden />
        <span>{config.label}</span>
      </span>
    </div>
  )
}
