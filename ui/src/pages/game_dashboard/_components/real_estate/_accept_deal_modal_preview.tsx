import { GameButton } from "../../../../components/game_ui/game_button";
import { MoneyValue } from "../../../../components/money/money_value";
import { DealArrowIcon, StarIcon } from "../../../../shared/icons";
import { AssetImageFrame } from "../../../../shared/components";
import type { profit_grade, PropertyOffer } from "../../_model/types";
import { SkillSegmentBar } from "../character/_skill_segment_bar";
import type { AcceptDealPreview, PropertyOfferPaymentMode } from "./_accept_deal_utils";
import { PROFIT_GRADE_STYLES } from "./_offer_styles";
import { PropertyPaymentModePicker } from "./_property_payment_mode";
import { calcDownPaymentAmount } from "./_accept_deal_utils";
import { useGameStore } from "../../../../stores/game.store";

type DealOutcome = "positive" | "negative" | "neutral";

function getDealOutcome(profitAmount: number): DealOutcome {
  if (profitAmount > 0) return "positive";
  if (profitAmount < 0) return "negative";
  return "neutral";
}

function getProfitPercent(offerPrice: number, marketPrice: number): number {
  if (marketPrice === 0) return 0;
  return (Math.abs(offerPrice - marketPrice) / marketPrice) * 100;
}

function TopbarGrade({ grade }: { grade: profit_grade }) {
  const style = PROFIT_GRADE_STYLES[grade];
  return (
    <span
      className={`property-sale-modal__grade ${style.badge}`}
      aria-label={`Категория ${grade}`}
    >
      {style.label}
    </span>
  );
}

function OfferBlock({
  offer,
  preview,
}: {
  offer: PropertyOffer;
  preview: AcceptDealPreview;
}) {
  const comparisonPrice = preview.isPurchase
    ? offer.marketPrice
    : (preview.purchasePrice ?? offer.marketPrice);
  const comparisonLabel = preview.isPurchase ? "Рыночная цена" : "Цена покупки";
  const comparisonWord = preview.isPurchase ? "рынку" : "покупке";

  const outcome = getDealOutcome(preview.profitAmount);
  const percent = getProfitPercent(offer.offerPrice, comparisonPrice)
    .toFixed(1)
    .replace(".", ",");
  const netProfit = preview.profitAmount;
  const offerLabel = preview.isPurchase ? "К оплате" : "Предложение";

  const statusLabel =
    outcome === "positive"
      ? preview.isPurchase
        ? "Выгодная покупка"
        : "Выгодная сделка"
      : outcome === "negative"
        ? preview.isPurchase
          ? "Выше рынка"
          : "Ниже покупки"
        : preview.isPurchase
          ? "По рыночной цене"
          : "По цене покупки";

  const isOverpayment = preview.isPurchase && netProfit < 0;
  const thirdMetricLabel = isOverpayment ? "Переплата" : "Чистая прибыль";

  const profitColor =
    netProfit > 0 ? "emerald" : netProfit < 0 ? "red" : "muted";
  const profitPrefix = isOverpayment
    ? undefined
    : netProfit > 0
      ? "+"
      : netProfit < 0
        ? "−"
        : undefined;

  const percentLabel =
    netProfit > 0
      ? `+${percent}% к ${comparisonWord}`
      : netProfit < 0
        ? `−${percent}% к ${comparisonWord}`
        : null;

  return (
    <section className="property-sale-modal__offer" aria-label="Условия сделки">
      <div className="property-sale-modal__offer-header">
        <span
          className={`property-sale-modal__offer-status property-sale-modal__offer-status--${outcome}`}
        >
          {statusLabel}
        </span>
        {percentLabel ? (
          <span
            className={`property-sale-modal__offer-percent property-sale-modal__offer-percent--${outcome}`}
          >
            {percentLabel}
          </span>
        ) : null}
      </div>

      <div className="property-sale-modal__offer-metrics">
        <div className="property-sale-modal__offer-metric">
          <span className="property-sale-modal__offer-metric-label">
            {offerLabel}
          </span>
          <MoneyValue
            amount={offer.offerPrice}
            size="md"
            color="white"
            className="property-sale-modal__offer-metric-value"
          />
        </div>

        <div className="property-sale-modal__offer-metric">
          <span className="property-sale-modal__offer-metric-label">
            {comparisonLabel}
          </span>
          <MoneyValue
            amount={comparisonPrice}
            size="md"
            color="muted"
            className="property-sale-modal__offer-metric-value"
          />
        </div>

        <div
          className={`property-sale-modal__offer-metric property-sale-modal__offer-metric--profit property-sale-modal__offer-metric--${outcome}`}
        >
          <span className="property-sale-modal__offer-metric-label">
            {thirdMetricLabel}
          </span>
          <MoneyValue
            amount={Math.abs(netProfit)}
            size="md"
            color={profitColor}
            prefix={profitPrefix}
            className="property-sale-modal__offer-metric-value"
          />
        </div>
      </div>
    </section>
  );
}

function ReputationBlock({
  previousReputation,
  reputation,
}: {
  previousReputation: number;
  reputation: number;
}) {
  const delta = reputation - previousReputation;
  const filled = Math.max(1, Math.min(10, Math.round(reputation)));
  const previousFilled = Math.max(
    0,
    Math.min(10, Math.round(previousReputation)),
  );
  const nextClass =
    delta > 0
      ? "property-sale-modal__reputation-next--positive"
      : delta < 0
        ? "property-sale-modal__reputation-next--negative"
        : "property-sale-modal__reputation-next--neutral";

  return (
    <section
      className="property-sale-modal__reputation"
      aria-label="Репутация после сделки"
    >
      <div className="property-sale-modal__reputation-header">
        <div className="property-sale-modal__reputation-label">
          <StarIcon
            className="property-sale-modal__reputation-icon"
            aria-hidden
          />
          <span className="property-sale-modal__reputation-title">
            Репутация после сделки
          </span>
        </div>

        <div
          className="property-sale-modal__reputation-change"
          aria-label={`${previousReputation.toFixed(1)} до ${reputation.toFixed(1)}`}
        >
          <span className="property-sale-modal__reputation-current">
            {previousReputation.toFixed(1)}
          </span>
          <span className="property-sale-modal__reputation-arrow" aria-hidden>
            →
          </span>
          <span className={`property-sale-modal__reputation-next ${nextClass}`}>
            {reputation.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="property-sale-modal__reputation-bar">
        <SkillSegmentBar
          filled={filled}
          total={10}
          size="sm"
          highlightLastFilled={delta > 0 && filled > previousFilled}
          className="justify-start gap-1"
        />
      </div>
    </section>
  );
}

export function AcceptDealPreviewView({
  offer,
  preview,
  reputation,
  balance,
  paymentMode,
  onPaymentModeChange,
  confirming,
  controlsLocked,
  onClose,
  onConfirm,
}: {
  offer: PropertyOffer;
  preview: AcceptDealPreview;
  reputation: number;
  balance: number;
  paymentMode: PropertyOfferPaymentMode;
  onPaymentModeChange: (mode: PropertyOfferPaymentMode) => void;
  confirming: boolean;
  controlsLocked: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent);
  const isPurchase = preview.isPurchase;
  const dealType = isPurchase ? "buy" : "sell";
  const actionVerb = isPurchase ? "Купить" : "Продать";
  const confirmAmount = isPurchase
    ? paymentMode === "full"
      ? offer.offerPrice
      : calcDownPaymentAmount(offer.offerPrice, offer.downPaymentPercent)
    : preview.saleBalanceCredit ?? offer.offerPrice;

  return (
    <>
      <header className="property-sale-modal__topbar">
        <div className="property-sale-modal__operation">
          <DealArrowIcon
            direction={dealType}
            className="property-sale-modal__operation-icon"
          />
          <span className="property-sale-modal__operation-label">
            {isPurchase ? "Покупка имущества" : "Продажа имущества"}
          </span>
        </div>

        <div className="property-sale-modal__topbar-actions">
          <TopbarGrade grade={offer.profitGrade} />
          <button
            type="button"
            className="property-sale-modal__close"
            onClick={onClose}
            disabled={controlsLocked}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
      </header>

      <div className="property-sale-modal__body">
        <div className="property-sale-modal__visual-card">
          <div className="property-sale-modal__visual-stage">
            <AssetImageFrame
              assetId={offer.assetId}
              alt={offer.itemName}
              size="fill"
              decorations={false}
              fallback={<span className="text-5xl">🏠</span>}
            />
          </div>
          <div className="property-sale-modal__visual-meta">
            Категория {offer.profitGrade}
          </div>
        </div>

        <div className="property-sale-modal__details">
          <header className="property-sale-modal__heading">
            <h2
              id="accept-deal-title"
              className="property-sale-modal__heading-title"
            >
              {offer.itemName}
            </h2>
            <p className="property-sale-modal__heading-subtitle">
              {isPurchase
                ? "Подтвердите покупку по текущему предложению"
                : "Подтвердите продажу по текущему предложению"}
            </p>
          </header>

          <OfferBlock offer={offer} preview={preview} />

          {isPurchase ? (
            <PropertyPaymentModePicker
              assetId={offer.assetId}
              price={offer.offerPrice}
              downPaymentPercent={offer.downPaymentPercent}
              interestRatePercent={bankBaseRatePercent}
              balance={balance}
              mode={paymentMode}
              onChange={onPaymentModeChange}
            />
          ) : null}

          {preview.installmentBreakdown && preview.saleBalanceCredit !== null ? (
            <div className="property-sale-modal__note">
              На баланс поступит{' '}
              <MoneyValue
                amount={preview.saleBalanceCredit}
                size="sm"
                color="emerald"
                className="inline-flex font-semibold"
              />
              {' · '}выплачено по кредиту + разница с ценой покупки (
              <MoneyValue
                amount={preview.installmentBreakdown.purchasePrice}
                size="sm"
                color="white"
                className="inline-flex font-semibold"
              />
              )
            </div>
          ) : null}

          <ReputationBlock
            previousReputation={reputation}
            reputation={preview.projectedReputation}
          />
        </div>
      </div>

      <footer className="property-sale-modal__footer">
        <GameButton
          variant="muted"
          size="sm"
          fullWidth
          disabled={controlsLocked}
          onClick={onClose}
          className="property-sale-modal__footer-btn"
        >
          Отмена
        </GameButton>

        <GameButton
          variant="emerald"
          size="sm"
          fullWidth
          disabled={controlsLocked}
          onClick={onConfirm}
          className="property-sale-modal__footer-btn property-sale-modal__confirm-btn"
        >
          {confirming ? (
            <span>{isPurchase ? "Покупка…" : "Продажа…"}</span>
          ) : (
            <span className="property-sale-modal__confirm-label">
              <span>{actionVerb} за</span>
              <MoneyValue
                amount={confirmAmount}
                size="md"
                color="amber"
                tone="overlay"
                className="property-sale-modal__confirm-money"
              />
            </span>
          )}
        </GameButton>
      </footer>
    </>
  );
}
