import type { CSSProperties } from "react";
import { GameButton } from "../../../../components/game_ui/game_button";
import {
  MoneyValue,
} from "../../../../components/money/money_value";
import { ChatBubbleIcon, LockOutlineIcon } from "../../../../shared/icons";
import { AssetImageFrame } from "../../../../shared/components";
import type { profit_grade, PropertyOffer } from "../../_model/types";
import "./_accept_deal_modal.css";
import "./_negotiate_modal.css";
import {
  calcActualMinDiceRoll,
  calcPurchaseDiscountDiceRequirement,
  calcSavings,
  formatPositiveDiscountLabel,
  getSuccessChanceTone,
  isNegotiateCheckRequired,
  NEGOTIATE_PURCHASE_DISCOUNT_MIN,
  NEGOTIATE_PURCHASE_DISCOUNT_STEP,
  NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT,
  sliderLockedPercentFromMaxAllowed,
  sliderPercentFromDiscountPercent,
} from "./_negotiate_utils";
import { hasInsufficientNegotiatePurchaseFunds, calcDownPaymentAmount } from "./_accept_deal_utils";
import { InstallmentPlanCaption } from "./_installment_plan_caption";
import { PROFIT_GRADE_STYLES } from "./_offer_styles";

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

function getConfirmButtonLabel(): string {
  return 'Предложить цену';
}

export function NegotiatePreviewView({
  offer,
  isPurchase,
  negotiatePercent,
  maxPercent,
  proposedPrice,
  successChance,
  reputation,
  balance,
  controlsLocked,
  submitError,
  onPercentChange,
  onClose,
  onConfirm,
}: {
  offer: PropertyOffer;
  isPurchase: boolean;
  negotiatePercent: number;
  maxPercent: number;
  proposedPrice: number;
  successChance: number;
  reputation: number;
  balance: number;
  controlsLocked: boolean;
  submitError: string | null;
  onPercentChange: (value: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const askingPrice = offer.offerPrice;
  const savings = calcSavings(askingPrice, proposedPrice);
  const repBonus = Math.floor(reputation);
  const diceRequirement = calcPurchaseDiscountDiceRequirement(negotiatePercent);
  const actualMinDiceRoll = calcActualMinDiceRoll(diceRequirement, reputation);
  const checkRequired = isNegotiateCheckRequired(successChance);
  const successTone = getSuccessChanceTone(successChance);
  const insufficientBalanceForPrice = hasInsufficientNegotiatePurchaseFunds(
    balance,
    isPurchase,
    proposedPrice,
    offer.downPaymentPercent,
  );
  const downPaymentAmount = isPurchase
    ? calcDownPaymentAmount(proposedPrice, offer.downPaymentPercent)
    : null;

  const absoluteMaxPercent = NEGOTIATE_SLIDER_MAX_DISCOUNT_PERCENT;
  const availableMaxPercent = maxPercent;
  const isPercentLimited = availableMaxPercent < absoluteMaxPercent;

  const sliderMin = NEGOTIATE_PURCHASE_DISCOUNT_MIN;
  const sliderStep = NEGOTIATE_PURCHASE_DISCOUNT_STEP;
  const sliderMax = absoluteMaxPercent;
  const thumbPercent = sliderPercentFromDiscountPercent(negotiatePercent);
  const lockedFromPercent = sliderLockedPercentFromMaxAllowed(availableMaxPercent);

  return (
    <>
      <div className="trade-modal__content">
        <header className="property-sale-modal__topbar">
          <div className="property-sale-modal__operation trade-modal__operation">
            <ChatBubbleIcon
              className="trade-modal__operation-icon"
              aria-hidden
            />
            <span className="trade-modal__operation-label">Торг</span>
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

        <div className="trade-modal__hero">
          <aside className="trade-modal__asset" aria-label="Объект сделки">
            <div className="trade-modal__asset-card property-sale-modal__visual-card">
              <div className="trade-modal__asset-media">
                <AssetImageFrame
                  assetId={offer.assetId}
                  alt={offer.itemName}
                  size="fill"
                  decorations={false}
                  fallback={<span className="trade-modal__asset-placeholder">🏠</span>}
                />
              </div>

              <h2 id="negotiate-title" className="trade-modal__asset-title">
                {offer.itemName}
              </h2>

              <div className="trade-modal__asset-category">
                Категория {offer.profitGrade}
              </div>
            </div>
          </aside>

          <section
            className="trade-modal__offer-panel"
            aria-label="Ваше предложение"
          >
            <header className="trade-modal__heading">
              <h3 className="trade-modal__heading-title">Ваше предложение</h3>
              <p className="trade-modal__heading-subtitle">
                {isPurchase
                  ? 'Чем больше скидка, тем ниже шанс успешной сделки.'
                  : 'Чем больше наценка, тем ниже шанс успешной сделки.'}
              </p>
            </header>

            <div className="trade-modal__offer-metrics">
              <div className="trade-modal__offer-metric trade-modal__offer-metric--primary trade-modal__offer-metric--split">
                <div className="trade-modal__offer-metric-part">
                  <span className="trade-modal__offer-metric-label">
                    Ваша цена
                  </span>
                  <MoneyValue amount={proposedPrice} size="lg" color="amber" />
                </div>

                {isPurchase && downPaymentAmount !== null ? (
                  <div className="trade-modal__offer-metric-part trade-modal__offer-metric-part--align-end">
                    <span className="trade-modal__offer-metric-label">
                      Первый взнос
                    </span>
                    <MoneyValue
                      amount={downPaymentAmount}
                      size="lg"
                      color={insufficientBalanceForPrice ? 'red' : 'white'}
                    />
                    <InstallmentPlanCaption
                      assetId={offer.assetId}
                      purchasePrice={proposedPrice}
                      downPaymentPercent={offer.downPaymentPercent}
                      className="mt-0.5 text-right"
                    />
                  </div>
                ) : null}
              </div>

              <div className="trade-modal__offer-metric trade-modal__offer-metric--secondary">
                <span className="trade-modal__offer-metric-label">
                  {isPurchase ? 'Цена продавца' : 'Цена покупателя'}
                </span>
                <MoneyValue amount={askingPrice} size="sm" color="muted" />
              </div>

              {isPurchase ? (
                <div className="trade-modal__offer-metric trade-modal__offer-metric--secondary">
                  <span className="trade-modal__offer-metric-label">
                    Экономия
                  </span>
                  <MoneyValue
                    amount={savings}
                    size="sm"
                    color={savings > 0 ? "emerald" : "muted"}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>

        <div className="trade-modal__sections">
          <section
            className="trade-modal__slider-panel"
            aria-label="Запрашиваемая скидка"
          >
            <div className="trade-modal__slider-header">
              <span
                className="trade-modal__slider-label"
                id="negotiate-discount-label"
              >
                {isPurchase ? "Запрашиваемая скидка" : "Запрашиваемая наценка"}
              </span>
              <span className="trade-modal__slider-value">
                {formatPositiveDiscountLabel(negotiatePercent)}
              </span>
            </div>

            <div className="trade-modal__slider-body">
              <div className="trade-modal__slider-track-wrap">
                <div className="trade-modal__slider-track" aria-hidden />
                {isPercentLimited ? (
                  <div
                    className="trade-modal__slider-locked"
                    style={{ left: `${lockedFromPercent}%`, right: "0" }}
                    aria-hidden
                  />
                ) : null}

                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={sliderStep}
                  value={negotiatePercent}
                  disabled={controlsLocked}
                  onChange={(event) =>
                    onPercentChange(Number(event.target.value))
                  }
                  onInput={(event) =>
                    onPercentChange(Number(event.currentTarget.value))
                  }
                  className="trade-modal__slider-input"
                  style={{ "--slider-pct": `${thumbPercent}%` } as CSSProperties}
                  aria-labelledby="negotiate-discount-label"
                  aria-valuemin={sliderMin}
                  aria-valuemax={availableMaxPercent}
                  aria-valuenow={negotiatePercent}
                  aria-valuetext={formatPositiveDiscountLabel(negotiatePercent)}
                />

                {isPercentLimited ? (
                  <div
                    className="trade-modal__slider-limit-marker"
                    style={{ left: `${lockedFromPercent}%` }}
                    aria-hidden
                  >
                    <LockOutlineIcon className="trade-modal__slider-limit-icon" />
                    <span>Лимит {availableMaxPercent}%</span>
                  </div>
                ) : null}
              </div>

              <div className="trade-modal__slider-ends" aria-hidden>
                <span>{NEGOTIATE_PURCHASE_DISCOUNT_MIN}%</span>
                <span>{absoluteMaxPercent}%</span>
              </div>
            </div>
          </section>

          <section
            className={`trade-modal__check trade-modal__check--${successTone}`}
            aria-label="Проверка сделки"
          >
            <p className="trade-modal__check-title">Проверка сделки</p>

            {!checkRequired ? (
              <p className="trade-modal__check-no-roll">
                Проверка не требуется
              </p>
            ) : (
              <div className="trade-modal__check-body">
                <div className="trade-modal__check-hero">
                  <span className="trade-modal__check-chance-value">
                    {successChance}%
                  </span>
                  <span className="trade-modal__check-chance-label">
                    Шанс успеха
                  </span>
                  <div
                    className="trade-modal__check-progress"
                    role="progressbar"
                    aria-valuenow={successChance}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Шанс успеха ${successChance}%`}
                  >
                    <div
                      className="trade-modal__check-progress-fill"
                      style={{ width: `${successChance}%` }}
                    />
                  </div>
                </div>

                <div className="trade-modal__check-stats">
                  <div className="trade-modal__check-stat">
                    <span className="trade-modal__check-stat-label">
                      Бросок D20
                    </span>
                    <span className="trade-modal__check-stat-value">
                      {actualMinDiceRoll}+
                    </span>
                  </div>

                  <div className="trade-modal__check-stat">
                    <span className="trade-modal__check-stat-label">
                      Репутация
                    </span>
                    <span className="trade-modal__check-stat-value">
                      +{repBonus}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      <footer className="trade-modal__footer">
        {submitError ? (
          <p className="trade-modal__footer-error" role="alert">
            {submitError}
          </p>
        ) : null}

        {insufficientBalanceForPrice ? (
          <p className="trade-modal__footer-error" role="status">
            Недостаточно средств для взноса по предложенной цене
          </p>
        ) : null}

        <GameButton
          variant="muted"
          size="sm"
          fullWidth
          disabled={controlsLocked}
          onClick={onClose}
          className="trade-modal__footer-btn trade-modal__footer-btn--cancel"
        >
          Отмена
        </GameButton>

        <GameButton
          variant="emerald"
          size="sm"
          fullWidth
          disabled={controlsLocked || successChance === 0 || insufficientBalanceForPrice}
          onClick={onConfirm}
          className="trade-modal__footer-btn trade-modal__confirm-btn"
        >
          {getConfirmButtonLabel()}
        </GameButton>
      </footer>
    </>
  );
}
