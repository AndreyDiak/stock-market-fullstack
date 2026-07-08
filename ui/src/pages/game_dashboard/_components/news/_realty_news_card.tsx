import type { news_item } from '../../_model/types'
import { useGameStore } from '../../../../stores/game.store'
import { useDashboardUi } from '../../_model/dashboard_ui_context'
import { AssetImageFrame } from '../../../../shared/components'
import { getNewsPropertyAlt, getNewsPropertyImage } from './_news_asset_image'
import { formatMoney } from '../../../../components/money/money_value'
import { PROFIT_GRADE_STYLES } from '../real_estate/_offer_styles'
import { GameButton } from '../../../../components/game_ui/game_button'
import type { GameDashboardThemeTokens } from '../shared'

const DEAL_TYPE_LABELS: Record<string, string> = {
  BUY: 'Покупка',
  SELL: 'Продажа',
}

interface RealtyNewsCardProps {
  item: news_item
  theme: GameDashboardThemeTokens
}

export function RealtyNewsCard({ item }: RealtyNewsCardProps) {
  const propertyOffers = useGameStore((state) => state.propertyOffers)
  const { openRealEstateTab } = useDashboardUi()
  const image = getNewsPropertyImage(item, propertyOffers)
  const alt = getNewsPropertyAlt(item, propertyOffers) ?? 'Недвижимость'

  const payload = item.payload as
    | { offerId?: string; assetId?: string; itemName?: string }
    | undefined
  const offer = payload?.offerId
    ? propertyOffers.find((o) => o.id === payload.offerId)
    : undefined

  return (
    <div className="news-realty">
      {image ? (
        <div className="news-realty__image-col">
          <AssetImageFrame
            src={image}
            alt={alt}
            className="news-realty__image-frame"
          />
        </div>
      ) : null}

      <div className="news-realty__content">
        {offer ? (
          <div className="news-realty__badges">
            <span className="news-realty__badge news-realty__badge--type">
              {DEAL_TYPE_LABELS[offer.type] ?? offer.type ?? 'Событие'}
            </span>
            <span className="news-realty__badge news-realty__badge--price">
              {formatMoney(offer.offerPrice)}
            </span>
            {(offer.profitPercent ?? 0) !== 0 ? (
              <span
                className={`news-realty__badge ${
                  (offer.profitPercent ?? 0) > 0
                    ? 'news-realty__badge--profit'
                    : 'news-realty__badge--loss'
                }`}
              >
                {(offer.profitPercent ?? 0) > 0 ? 'Выгода +' : 'Невыгодно '}
                {(offer.profitPercent ?? 0).toFixed(1)}%
              </span>
            ) : null}
            <span className={`news-realty__badge ${PROFIT_GRADE_STYLES[offer.profitGrade].badge}`}>
              Категория {PROFIT_GRADE_STYLES[offer.profitGrade].label}
            </span>
          </div>
        ) : null}

        <h4 className="news-realty__title">{item.title}</h4>
        <p className="news-realty__description">{item.body}</p>

        {offer ? (
          <p className="news-realty__bank-note">
            Нужно: Банковское дело {offer.requiredBankingLevel}
          </p>
        ) : null}

        <div className="news-realty__actions">
          {payload?.offerId ? (
            <GameButton size="sm" variant="emerald" onClick={(e) => { e.stopPropagation(); openRealEstateTab(payload.offerId) }}>
              Открыть объект
            </GameButton>
          ) : null}
          {payload?.assetId ? (
            <GameButton size="sm" variant="teal" onClick={(e) => { e.stopPropagation(); openRealEstateTab() }}>
              Перейти на рынок
            </GameButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}
