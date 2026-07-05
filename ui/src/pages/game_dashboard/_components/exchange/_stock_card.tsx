import { useMemo } from 'react';
import { MoneyValue } from '../../../../components/money/money_value';
import type { StockListing } from '../../../../api/stocks';
import { ProfitGradeBadge } from '../real_estate/_profit_grade_badge';
import { formatBankingRequiredLabel } from '../real_estate/_offer_styles';
import { STOCK_GRADE_CONFIG, formatSectorLabel } from './_stock_grade_config';
import { StockSparkline } from './_stock_sparkline';
import { getHistoryWindowMeta, getSparklineDisplayHistory, resolveListingHistory } from './_stock_sparkline_utils';
import { StockChangeBadge } from './_stock_change_badge';
import { StockCardFooter } from './_stock_card_footer';
import { gameAudio } from '../../../../lib/audio/game_audio';
import '../real_estate/_asset_market_card.css';
import './_exchange.css';

function getLockLabel(listing: StockListing) {
  if (!listing.availableOnExchange) return 'Только через IPO';
  return formatBankingRequiredLabel(STOCK_GRADE_CONFIG[listing.grade].minBankingLevel);
}

export function StockCard({
  listing,
  highlighted,
  onOpenChart,
}: {
  listing: StockListing;
  highlighted?: boolean;
  onOpenChart: () => void;
}) {
  const turnUp = listing.dayChange >= 0;
  const locked = listing.isLocked || !listing.availableOnExchange;
  const lockLabel = getLockLabel(listing);

  const chartHistory = useMemo(
    () => resolveListingHistory(listing, listing.history),
    [listing],
  );

  const displayHistory = useMemo(() => getSparklineDisplayHistory(chartHistory), [chartHistory]);
  const periodMeta = useMemo(() => getHistoryWindowMeta(chartHistory), [chartHistory]);

  const handleDetails = () => {
    gameAudio.playSfx('buttonClick');
    onOpenChart();
  };

  return (
    <article
      id={`stock-listing-${listing.id}`}
      className={[
        'asset-market-card asset-market-card--deal-buy stock-card',
        highlighted ? 'asset-market-card--selected stock-card--highlighted' : '',
        locked ? 'asset-market-card--disabled stock-card--locked' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="asset-market-card__shell stock-card__shell">
        <div className="asset-market-card__top-rail">
          <div className="asset-market-card__deal">
            <span className="hidden h-1.5 w-1.5 rounded-full bg-red-400/55 sm:inline" aria-hidden />
            <span className="hidden h-1.5 w-1.5 rounded-full bg-amber-400/55 sm:inline" aria-hidden />
            <span
              className={`hidden h-1.5 w-1.5 rounded-full sm:inline ${
                highlighted ? 'bg-emerald-400/90' : 'bg-emerald-600/45'
              }`}
              aria-hidden
            />

            <span className="stock-card__header-sector">{formatSectorLabel(listing.sector)}</span>

            {listing.hasInsiderPressure ? (
              <span className="stock-card__header-insider" aria-label="Активный инсайд">
                🔥
              </span>
            ) : null}
          </div>

          <ProfitGradeBadge grade={listing.grade} embedded />
        </div>

        <div className="stock-card__body">
          <div className="stock-card__title-row">
            <h3 className="stock-card__name" title={listing.name}>
              {listing.name}
            </h3>
            <div className="stock-card__change-group" aria-label="Изменение цены">
              <StockChangeBadge
                value={listing.dayChange}
                emphasis="primary"
                ariaLabel="Изменение за ход"
              />
              <StockChangeBadge
                label="Период"
                value={periodMeta.changePct}
                emphasis="secondary"
                ariaLabel="Изменение за период графика"
              />
            </div>
          </div>

          <p className="stock-card__ticker">{listing.ticker}</p>

          <StockSparkline history={displayHistory} up={turnUp} />

          <div className="stock-card__price-row">
            <span className="stock-card__price-label">Цена</span>
            <MoneyValue amount={listing.currentPrice} size="lg" color="white" />
          </div>
        </div>

        <StockCardFooter locked={locked} lockLabel={lockLabel} onDetails={handleDetails} />
      </div>
    </article>
  );
}
