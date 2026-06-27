import { useState } from "react";
import type {
  AcceptPropertyOfferResponse,
  NegotiatePropertyOfferResponse,
} from "../../../../api/propertyOffers";
import { MoneyValue } from "../../../../components/money/money_value";
import { getRealEstateImage } from "../../../../constants/realEstateImages";
import { DealArrowIcon } from "../../../../shared/icons";
import { useGameStore } from "../../../../stores/game.store";
import type { PropertyOffer } from "../../_model/types";
import { format_turns_remaining_label } from "../../_model/utils";
import { AcceptDealModal } from "./_accept_deal_modal";
import "./_asset_market_card.css";
import { NegotiateModal } from "./_negotiate_modal";
import {
  getNegotiateBlockReason,
  OfferCardActions,
} from "./_offer_card_actions";
import {
  formatGradeRequiredLabel,
  formatOfferPriceVsMarket,
  getDealTypeLabel,
  getPlayerDealType,
  getPriceCaption,
} from "./_offer_styles";
import { ProfitGradeBadge } from "./_profit_grade_badge";

function getBlockReason(
  offer: PropertyOffer,
  isPurchase: boolean,
  noFreeSlots: boolean,
  notInInventory: boolean,
): string | null {
  if (isPurchase && noFreeSlots) return "Нет свободных слотов";
  if (!isPurchase && notInInventory) return "Нет в инвентаре";
  if (offer.isLocked) return formatGradeRequiredLabel(offer.profitGrade);
  return null;
}

export function PropertyOfferCard({
  offer,
  highlighted,
  busy,
  onAccept,
  onNegotiate,
}: {
  offer: PropertyOffer;
  highlighted?: boolean;
  busy?: boolean;
  onAccept: (offerId: string) => Promise<AcceptPropertyOfferResponse>;
  onNegotiate: (
    offerId: string,
    adjustmentPercent: number,
  ) => Promise<NegotiatePropertyOfferResponse>;
}) {
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const propertySlots = useGameStore((state) => state.propertySlots);
  const image = getRealEstateImage(offer.assetId);
  const dealType = getPlayerDealType(offer.type);
  const isPurchase = dealType === "buy";
  const profitable = offer.profitPercent >= 0;
  const isHotDeal = offer.profitPercent > 50 || offer.isHot;
  const isUrgent = offer.expiresInTurns <= 1;
  const freeSlots = propertySlots.filter(
    (slot) => !slot.isLocked && !slot.item,
  ).length;
  const noFreeSlots = isPurchase && freeSlots === 0;
  const notInInventory = !isPurchase && !offer.inventoryItemId;
  const blockReason = getBlockReason(
    offer,
    isPurchase,
    noFreeSlots,
    notInInventory,
  );
  const actionDisabled = busy || Boolean(blockReason);
  const negotiateBlockReason = busy
    ? null
    : getNegotiateBlockReason(offer, noFreeSlots);
  const negotiateDisabled = busy || Boolean(negotiateBlockReason);
  const fullyDisabled = actionDisabled && negotiateDisabled;
  const marketLabel = formatOfferPriceVsMarket(
    offer.offerPrice,
    offer.marketPrice,
  );

  return (
    <>
      <article
        id={`property-offer-${offer.id}`}
        tabIndex={0}
        className={[
          "asset-market-card",
          dealType === "buy"
            ? "asset-market-card--deal-buy"
            : "asset-market-card--deal-sell",
          highlighted ? "asset-market-card--selected" : "",
          isHotDeal ? "asset-market-card--hot" : "",
          fullyDisabled ? "asset-market-card--disabled" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="asset-market-card__shell">
          <div className="asset-market-card__top-rail">
            <div className="asset-market-card__deal">
              <span className="hidden h-1.5 w-1.5 rounded-full bg-red-400/55 sm:inline" aria-hidden />
              <span className="hidden h-1.5 w-1.5 rounded-full bg-amber-400/55 sm:inline" aria-hidden />
              <span
                className={`hidden h-1.5 w-1.5 rounded-full sm:inline ${
                  highlighted ? "bg-emerald-400/90" : "bg-emerald-600/45"
                }`}
                aria-hidden
              />

              <DealArrowIcon
                direction={dealType}
                className="asset-market-card__deal-icon h-3.5 w-3.5 shrink-0"
              />

              <span className="asset-market-card__deal-label">
                {getDealTypeLabel(dealType)}
              </span>

              <span className="asset-market-card__deal-separator" aria-hidden>
                ·
              </span>

              <span className="asset-market-card__deal-context">Рынок</span>

              {isHotDeal ? (
                <span
                  className="asset-market-card__deal-hot"
                  aria-label="Горячее предложение"
                >
                  🔥
                </span>
              ) : null}
            </div>

            <ProfitGradeBadge grade={offer.profitGrade} embedded />
          </div>

          <div className="asset-market-card__main">
            <div className="asset-market-card__visual">
              <div className="asset-market-card__visual-glow" aria-hidden />
              <div className="asset-market-card__visual-floor" aria-hidden />
              <div className="asset-market-card__image-wrap">
                {image ? (
                  <img
                    src={image}
                    alt={offer.itemName}
                    className="asset-market-card__image"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl">
                    🏠
                  </div>
                )}
              </div>
            </div>

            <div className="asset-market-card__content">
              <div className="asset-market-card__title-row">
                <h3 className="asset-market-card__title">{offer.itemName}</h3>

                <p className="asset-market-card__price-caption">
                  {getPriceCaption(dealType)}
                </p>

                <div className="asset-market-card__price-row">
                  <MoneyValue
                    amount={offer.offerPrice}
                    size="sm"
                    color="white"
                  />
                </div>

                <span
                  className={[
                    "asset-market-card__market-chip",
                    profitable
                      ? "asset-market-card__market-chip--profit"
                      : "asset-market-card__market-chip--loss",
                    fullyDisabled ? "opacity-80" : "",
                  ].join(" ")}
                >
                  {marketLabel}
                </span>
              </div>

              <div
                className={[
                  "asset-market-card__stats asset-market-card__term",
                  isPurchase ? "" : "asset-market-card__stats--single",
                ].join(" ")}
              >
                {isPurchase ? (
                  <div>
                    <span className="asset-market-card__stat-label">Взнос</span>
                    <span className="asset-market-card__stat-value">
                      {offer.downPaymentPercent}%
                    </span>
                  </div>
                ) : null}
                <div>
                  <span className="asset-market-card__stat-label">Срок</span>
                  <span
                    className={[
                      "asset-market-card__stat-value",
                      isUrgent ? "asset-market-card__stat-value--urgent" : "",
                    ].join(" ")}
                  >
                    {format_turns_remaining_label(offer.expiresInTurns)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="asset-market-card__footer">
            <OfferCardActions
              dealType={dealType}
              blockReason={blockReason}
              negotiateBlockReason={negotiateBlockReason}
              actionDisabled={actionDisabled}
              negotiateDisabled={negotiateDisabled}
              onAccept={() => setAcceptOpen(true)}
              onNegotiate={() => setNegotiateOpen(true)}
            />
          </div>
        </div>
      </article>

      <AcceptDealModal
        open={acceptOpen}
        offer={offer}
        busy={busy}
        onClose={() => setAcceptOpen(false)}
        onConfirm={(id) => onAccept(id)}
      />

      <NegotiateModal
        open={negotiateOpen}
        offer={offer}
        busy={busy}
        onClose={() => setNegotiateOpen(false)}
        onRoll={(adjustmentPercent) => onNegotiate(offer.id, adjustmentPercent)}
      />
    </>
  );
}
