import { useMemo, useState } from "react";
import type {
  AcceptPropertyOfferResponse,
  NegotiatePropertyOfferResponse,
} from "../../../../api/propertyOffers";
import { MoneyValue } from "../../../../components/money/money_value";
import { CoinIcon, BankIcon, DealArrowIcon } from "../../../../shared/icons";
import { AssetImageFrame } from "../../../../shared/components";
import { useGameStore } from "../../../../stores/game.store";
import type { PropertyOffer } from "../../_model/types";
import { format_turns_left_label } from "../../_model/utils";
import { AcceptDealModal } from "./_accept_deal_modal";
import "./_asset_market_card.css";
import { NegotiateModal } from "./_negotiate_modal";
import {
  getNegotiateBlockReason,
  OfferCardActions,
} from "./_offer_card_actions";
import {
  formatBankingRequiredLabel,
  formatMarketComparisonPercent,
  getDealTypeLabel,
  getMarketComparisonCaption,
  getPlayerDealType,
  getPriceCaption,
} from "./_offer_styles";
import {
  getPurchaseInstallmentPlan,
  getSellOfferEconomics,
  hasInsufficientDownPayment,
  INSUFFICIENT_DOWN_PAYMENT_REASON,
} from "./_accept_deal_utils";
import { REAL_ESTATE_CATALOG } from "../../../../constants/realEstate";
import { ProfitGradeBadge } from "./_profit_grade_badge";
import {
  calcPurchaseProposedPrice,
  getMaxNegotiateDiscountPercent,
} from "./_negotiate_utils";
import {
  applyBankingLevelToPropertyOffer,
  getPlayerBankingLevel,
} from "./_property_offer_access";

function getBlockReason(
  offer: PropertyOffer,
  isPurchase: boolean,
  noFreeSlots: boolean,
  notInInventory: boolean,
  balance: number,
): string | null {
  if (isPurchase && noFreeSlots) return "Нет свободных слотов";
  if (!isPurchase && notInInventory) return "Нет в инвентаре";
  if (offer.isLocked) {
    return formatBankingRequiredLabel(offer.requiredBankingLevel);
  }
  if (
    hasInsufficientDownPayment(
      balance,
      isPurchase,
      offer.offerPrice,
      offer.downPaymentPercent,
    )
  ) {
    return INSUFFICIENT_DOWN_PAYMENT_REASON;
  }
  return null;
}

export function PropertyOfferCard({
  offer: offerProp,
  highlighted,
  busy,
  onAccept,
  onNegotiate,
  onAcceptNegotiated,
  onDeclineNegotiated,
}: {
  offer: PropertyOffer;
  highlighted?: boolean;
  busy?: boolean;
  onAccept: (
    offerId: string,
    paymentMode: import('../../../../api/propertyOffers').PropertyOfferPaymentMode,
  ) => Promise<AcceptPropertyOfferResponse>;
  onNegotiate: (
    offerId: string,
    adjustmentPercent: number,
  ) => Promise<NegotiatePropertyOfferResponse>;
  onAcceptNegotiated: (
    offerId: string,
    paymentMode: import('../../../../api/propertyOffers').PropertyOfferPaymentMode,
  ) => Promise<AcceptPropertyOfferResponse>;
  onDeclineNegotiated: (offerId: string) => Promise<void>;
}) {
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const propertySlots = useGameStore((state) => state.propertySlots);
  const inventoryItems = useGameStore((state) => state.inventoryItems);
  const balance = useGameStore((state) => state.balance);
  const characterSkills = useGameStore((state) => state.characterSkills);
  const tradingLevel = useGameStore((state) => state.characterProfile.tradingLevel) || 1;
  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent);
  const offer = useMemo(
    () =>
      applyBankingLevelToPropertyOffer(
        offerProp,
        getPlayerBankingLevel(characterSkills),
      ),
    [offerProp, characterSkills],
  );
  const dealType = getPlayerDealType(offer.type);
  const isPurchase = dealType === "buy";
  const installmentPlan = isPurchase
    ? getPurchaseInstallmentPlan(
        offer.assetId,
        offer.offerPrice,
        offer.downPaymentPercent,
        bankBaseRatePercent,
      )
    : null;
  const profitable = offer.profitPercent >= 0;
  const isHotDeal = offer.profitPercent > 50 || offer.isHot;
  const isUrgent = offer.expiresInTurns <= 1;
  const freeSlots = propertySlots.filter(
    (slot) => !slot.isLocked && !slot.item,
  ).length;
  const noFreeSlots = isPurchase && freeSlots === 0;
  const notInInventory =
    !isPurchase &&
    (!offer.inventoryItemId ||
      !inventoryItems.some((item) => item.id === offer.inventoryItemId));
  const blockReason = getBlockReason(
    offer,
    isPurchase,
    noFreeSlots,
    notInInventory,
    balance,
  );
  const actionDisabled = busy || Boolean(blockReason);
  const maxNegotiateDiscount = getMaxNegotiateDiscountPercent(tradingLevel);
  const minNegotiatedPurchasePrice = isPurchase
    ? calcPurchaseProposedPrice(offer.offerPrice, maxNegotiateDiscount, maxNegotiateDiscount)
    : offer.offerPrice;
  const negotiateBlockReason = busy
    ? null
    : getNegotiateBlockReason(
        offer,
        noFreeSlots,
        isPurchase,
        notInInventory,
        balance,
        minNegotiatedPurchasePrice,
      );
  const negotiateDisabled = busy || Boolean(negotiateBlockReason);
  const fullyDisabled = actionDisabled && negotiateDisabled;
  const marketComparisonCaption = getMarketComparisonCaption(
    offer.offerPrice,
    offer.marketPrice,
  );
  const marketComparisonPercent = formatMarketComparisonPercent(
    offer.offerPrice,
    offer.marketPrice,
  );
  const sellEconomics = useMemo(
    () => (!isPurchase ? getSellOfferEconomics(offer, inventoryItems) : null),
    [isPurchase, offer, inventoryItems],
  );

  const catalogEntry = useMemo(
    () => REAL_ESTATE_CATALOG.find((r) => r.id === offer.assetId),
    [offer.assetId],
  );

  const passiveIncome = useMemo(() => {
    if (!catalogEntry?.special) return 0
    const match = catalogEntry.special.match(/(\d+)\/ход/)
    return match ? Number(match[1]) : 0
  }, [catalogEntry])

  const maintenanceCost = useMemo(() => {
    if (!catalogEntry?.special) return 0
    const match = catalogEntry.special.match(/Обслуживание:\s*(\d+)\/ход/)
    return match ? Number(match[1]) : 0
  }, [catalogEntry])

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

            <span
              className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[11px] font-bold tracking-wide ${
                isUrgent
                  ? 'animate-pulse border-yellow-500/40 bg-yellow-500/15 text-yellow-200'
                  : 'border-slate-600/50 bg-slate-700/50 text-slate-300'
              }`}
            >
              {isUrgent ? 'Последний шанс' : format_turns_left_label(offer.expiresInTurns)}
            </span>

            <ProfitGradeBadge grade={offer.profitGrade} embedded />
          </div>

          <div className="asset-market-card__main">
            <div className="asset-market-card__visual">
              <AssetImageFrame
                assetId={offer.assetId}
                alt={offer.itemName}
                size="fill"
                fallback={<span className="text-3xl">🏠</span>}
              />
            </div>

            <div className="asset-market-card__content">
              <h3 className="asset-market-card__title">{offer.itemName}</h3>

              <div className="asset-market-card__price-band">
                <div className="asset-market-card__price-metric">
                  <span className="asset-market-card__price-caption">
                    {getPriceCaption(dealType)}
                  </span>
                  <MoneyValue
                    amount={offer.offerPrice}
                    size="sm"
                    color="white"
                    className="asset-market-card__money-nowrap asset-market-card__price-value"
                  />
                </div>

                <div className="asset-market-card__market-metric">
                  <span className="asset-market-card__price-caption">
                    {marketComparisonCaption}
                  </span>
                  <span
                    className={[
                      "asset-market-card__market-percent",
                      profitable
                        ? "asset-market-card__market-percent--profit"
                        : "asset-market-card__market-percent--loss",
                      fullyDisabled ? "opacity-80" : "",
                    ].join(" ")}
                  >
                    {marketComparisonPercent}
                  </span>
                </div>
              </div>

              {isPurchase && passiveIncome > 0 ? (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs">
                    <CoinIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-slate-400">Пассивный доход</span>
                    <span className="ml-auto font-bold text-emerald-400 tabular-nums">
                      +{passiveIncome}/ход
                    </span>
                  </div>
                  {maintenanceCost > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <BankIcon className="h-3.5 w-3.5 text-red-400" />
                      <span className="text-slate-400">Обслуживание</span>
                      <span className="ml-auto font-bold text-red-400 tabular-nums">
                        −{maintenanceCost}/ход
                      </span>
                    </div>
                  ) : null}
                  {maintenanceCost > 0 ? (
                    <div className="flex items-center gap-1.5 border-t border-slate-700/30 pt-1 text-xs">
                      <span className="text-slate-500">Чистый доход</span>
                      <span className="ml-auto font-bold text-emerald-400 tabular-nums">
                        +{passiveIncome - maintenanceCost}/ход
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {isPurchase && installmentPlan ? (
                <div className="asset-market-card__stats asset-market-card__stats--purchase">
                  <div className="asset-market-card__stats-row asset-market-card__stats-row--triple">
                    <div className="asset-market-card__stat-cell">
                      <span className="asset-market-card__stat-label">Взнос</span>
                      <MoneyValue
                        amount={installmentPlan.downPayment}
                        size="xs"
                        color="white"
                        className="asset-market-card__stat-value asset-market-card__money-nowrap"
                      />
                    </div>
                    <div className="asset-market-card__stat-cell">
                      <span className="asset-market-card__stat-label">Платёж</span>
                      <MoneyValue
                        amount={installmentPlan.monthlyPayment}
                        size="xs"
                        color="white"
                        suffix="/ход"
                        className="asset-market-card__stat-value asset-market-card__money-nowrap"
                      />
                    </div>
                    <div className="asset-market-card__stat-cell asset-market-card__stat-cell--end">
                      <span className="asset-market-card__stat-label">Срок</span>
                      <span className="asset-market-card__stat-value asset-market-card__stat-value--term">
                        {format_turns_left_label(installmentPlan.installmentsTotal)}
                      </span>
                    </div>
                  </div>

                  <div className="asset-market-card__stats-row asset-market-card__stats-row--summary">
                    <div className="asset-market-card__stat-cell asset-market-card__stat-cell--span-2">
                      <span className="asset-market-card__stat-label">Переплата</span>
                      <MoneyValue
                        amount={installmentPlan.overpayment}
                        size="xs"
                        color="amber"
                        className="asset-market-card__stat-value asset-market-card__money-nowrap"
                      />
                    </div>
                    <div className="asset-market-card__stat-cell asset-market-card__stat-cell--end">
                      <span className="asset-market-card__stat-label">Итого</span>
                      <MoneyValue
                        amount={installmentPlan.totalWithInterest}
                        size="xs"
                        color="white"
                        className="asset-market-card__stat-value asset-market-card__money-nowrap"
                      />
                    </div>
                  </div>
                </div>
              ) : sellEconomics ? (
                <div className="asset-market-card__stats asset-market-card__stats--sell">
                  <div className="asset-market-card__stats-row asset-market-card__stats-row--double">
                    <div className="asset-market-card__stat-cell">
                      <span className="asset-market-card__stat-label">Куплено за</span>
                      <MoneyValue
                        amount={sellEconomics.purchasePrice}
                        size="xs"
                        color="white"
                        className="asset-market-card__stat-value asset-market-card__money-nowrap"
                      />
                    </div>
                    <div className="asset-market-card__stat-cell asset-market-card__stat-cell--end">
                      <span className="asset-market-card__stat-label">Прибыль</span>
                      <MoneyValue
                        amount={Math.abs(sellEconomics.profit)}
                        size="xs"
                        color={sellEconomics.profit >= 0 ? "emerald" : "red"}
                        prefix={
                          sellEconomics.profit > 0
                            ? "+"
                            : sellEconomics.profit < 0
                              ? "−"
                              : undefined
                        }
                        className="asset-market-card__stat-value asset-market-card__money-nowrap"
                      />
                    </div>
                  </div>
                </div>
              ) : null}
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
        onConfirm={(id, paymentMode) => onAccept(id, paymentMode)}
      />

      <NegotiateModal
        open={negotiateOpen}
        offer={offer}
        busy={busy}
        onClose={() => setNegotiateOpen(false)}
        onRoll={(adjustmentPercent) => onNegotiate(offer.id, adjustmentPercent)}
        onAcceptNegotiated={(id, paymentMode) => onAcceptNegotiated(id, paymentMode)}
        onDeclineNegotiated={onDeclineNegotiated}
      />
    </>
  );
}
