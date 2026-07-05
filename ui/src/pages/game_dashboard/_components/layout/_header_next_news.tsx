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
  const { lastType } = resolveNewsCycleState(visibleNews)
  const currentType = lastType ?? 'stock'
  const config = NEWS_CATEGORY_CONFIG[currentType]
  const Icon = config.Icon

  return (
    <div
      className="header__next-news"
      title={`Текущая новость: ${config.label.toLowerCase()}`}
      aria-label={`Текущая новость: ${config.label}`}
    >
      <span className={`header__next-news-chip ${config.chipClass}`}>
        <Icon className="header__next-news-icon" aria-hidden />
        <span>{config.label}</span>
      </span>
    </div>
  )
}
