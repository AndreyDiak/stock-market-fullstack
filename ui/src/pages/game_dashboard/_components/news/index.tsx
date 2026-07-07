import { useEffect } from 'react'

import { useGameStore } from '../../../../stores/game.store'

import { useDashboardUi } from '../../_model/dashboard_ui_context'

import { useDashboardTheme } from '../../_model/use_dashboard_theme'

import { PanelSectionHeading } from '../shared'

import {

  filter_visible_news,

  find_latest_market_news,
  find_pinned_insider,
  sort_news_for_panel,
} from '../../_model/utils'

import { NewsCard } from './_news_card'

import { NewsCycleIndicator } from './_news_cycle_indicator'

import './_news.css'



export function NewsPanel() {

  const theme = useDashboardTheme()

  const { selectNews } = useDashboardUi()

  const news = useGameStore((state) => state.news)

  const turn = useGameStore((state) => state.turn)

  const loadNews = useGameStore((state) => state.loadNews)



  useEffect(() => {

    void loadNews()

  }, [loadNews])



  const visibleNews = filter_visible_news(news, turn)

  const pinned = find_pinned_insider(visibleNews, turn)
  const latestMarketNews = find_latest_market_news(visibleNews, turn)

  const feed = sort_news_for_panel(visibleNews, turn).filter(

    (item) => !pinned || item.id !== pinned.id,

  )



  return (

    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">

      <header className="news-page__header">

        <PanelSectionHeading

          title="Новости"

          subtitle="Лента рынка, слухи и инсайдерская информация"

        />

      </header>



      <NewsCycleIndicator news={visibleNews} />



      <div className={`news-feed ${theme.scrollArea}`}>

        {pinned ? (

          <NewsCard

            item={pinned}

            theme={theme}

            variant="full"

            pinned

            turn={turn}

            onSelect={selectNews}

          />

        ) : null}



        {feed.length === 0 && !pinned ? (

          <p className={`rounded-2xl border p-6 text-center text-sm ${theme.sidebarInset}`}>

            Пока нет новостей за этот период

          </p>

        ) : (

          feed.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              theme={theme}
              variant="full"
              latest={latestMarketNews?.id === item.id}
              turn={turn}
              onSelect={selectNews}
            />
          ))

        )}

      </div>

    </div>

  )

}


