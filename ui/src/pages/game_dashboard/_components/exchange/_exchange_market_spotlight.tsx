import { motion } from 'framer-motion';
import type { StockListing } from '../../../../api/stocks';
import { StockCard } from './_stock_card';
import {
  realEstateCardsContainerVariants,
  realEstateOfferCardVariants,
} from '../../_model/real_estate_panel_animation';

export function ExchangeMarketSpotlight({
  insiderListings,
  highlightStockListingId,
  onOpenChart,
  onInsiderClick,
}: {
  insiderListings: StockListing[];
  highlightStockListingId?: string | null;
  onOpenChart: (listing: StockListing) => void;
  onInsiderClick?: (ticker: string) => void;
}) {
  if (insiderListings.length === 0) return null;

  return (
    <section className="exchange-spotlight" aria-label="Важные события на рынке">
      <div className="exchange-spotlight__block exchange-spotlight__block--insider">
        <div className="exchange-spotlight__header">
          <span className="exchange-spotlight__badge exchange-spotlight__badge--insider">
            Инсайд
          </span>
          <div className="exchange-spotlight__copy">
            <h3 className="exchange-spotlight__title">Активное давление новостей</h3>
            <p className="exchange-spotlight__text">
              На эти бумаги сейчас влияют инсайдерские сигналы — цена может резко измениться
            </p>
          </div>
        </div>

        <motion.div
          className="grid grid-cols-1 items-stretch gap-5 min-[720px]:grid-cols-2"
          variants={realEstateCardsContainerVariants}
          initial="hidden"
          animate="show"
        >
          {insiderListings.map((listing) => (
            <motion.div key={listing.id} variants={realEstateOfferCardVariants} className="flex min-w-0">
              <StockCard
                listing={listing}
                highlighted={listing.id === highlightStockListingId}
                onOpenChart={() => onOpenChart(listing)}
                onInsiderClick={() => onInsiderClick?.(listing.ticker)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
