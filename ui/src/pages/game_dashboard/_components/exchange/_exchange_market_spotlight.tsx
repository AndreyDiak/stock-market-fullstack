import { motion } from 'framer-motion';
import type { IpoListing, StockListing } from '../../../../api/stocks';
import { IpoSection } from './_ipo_section';
import { StockCard } from './_stock_card';
import {
  realEstateCardsContainerVariants,
  realEstateOfferCardVariants,
} from '../../_model/real_estate_panel_animation';
import { ProfitGradeBadge } from '../real_estate/_profit_grade_badge';
import { SectorBadge } from './_sector_badge';

export function ExchangeMarketSpotlight({
  ipos,
  insiderListings,
  ipoTrackListings,
  currentTurn,
  stockBusy,
  highlightStockListingId,
  onSubscribe,
  onOpenChart,
  onInsiderClick,
}: {
  ipos: IpoListing[];
  insiderListings: StockListing[];
  ipoTrackListings: StockListing[];
  currentTurn: number;
  stockBusy?: boolean;
  highlightStockListingId?: string | null;
  onSubscribe: (ipoId: string, amount: number) => Promise<void>;
  onOpenChart: (listing: StockListing) => void;
  onInsiderClick?: (ticker: string) => void;
}) {
  const hasContent =
    ipos.length > 0 || insiderListings.length > 0 || ipoTrackListings.length > 0;

  if (!hasContent) return null;

  return (
    <section className="exchange-spotlight" aria-label="Важные события на рынке">
      {ipos.length > 0 ? (
        <div className="exchange-spotlight__block exchange-spotlight__block--ipo">
          <div className="exchange-spotlight__header">
            <span className="exchange-spotlight__badge exchange-spotlight__badge--ipo">IPO</span>
            <div className="exchange-spotlight__copy">
              <h3 className="exchange-spotlight__title">Размещение на бирже</h3>
              <p className="exchange-spotlight__text">
                Открыта подписка — успейте участвовать до закрытия книги
              </p>
            </div>
          </div>
          <IpoSection
            ipos={ipos}
            currentTurn={currentTurn}
            busy={stockBusy}
            onSubscribe={onSubscribe}
            embedded
          />
        </div>
      ) : null}

      {insiderListings.length > 0 ? (
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
      ) : null}

      {ipoTrackListings.length > 0 ? (
        <div className="exchange-spotlight__block exchange-spotlight__block--preipo">
          <div className="exchange-spotlight__header">
            <span className="exchange-spotlight__badge exchange-spotlight__badge--preipo">
              До IPO
            </span>
            <div className="exchange-spotlight__copy">
              <h3 className="exchange-spotlight__title">Ожидают выхода на биржу</h3>
              <p className="exchange-spotlight__text">
                Покупка возможна только через размещение — следите за новостями и блоком IPO
              </p>
            </div>
          </div>

          <ul className="exchange-spotlight__preipo-list">
            {ipoTrackListings.map((listing) => (
              <li key={listing.id} className="exchange-spotlight__preipo-item">
                <div className="exchange-spotlight__preipo-main">
                  <span className="exchange-spotlight__preipo-ticker">{listing.ticker}</span>
                  <span className="exchange-spotlight__preipo-name">{listing.name}</span>
                  <SectorBadge sector={listing.sector} size="md" />
                </div>
                <ProfitGradeBadge grade={listing.grade} embedded />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
