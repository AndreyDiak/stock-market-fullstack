import { MoneyValue, formatMoney } from '../../../../components/money/money_value';
import { GameButton } from '../../../../components/game_ui/game_button';
import { DealArrowIcon, StarIcon, TrendArrowIcon } from '../../../../shared/icons';
import type { PropertyOffer } from '../../_model/types';
import type { profit_grade } from '../../_model/types';
import { SkillSegmentBar } from '../character/_skill_segment_bar';
import type { AcceptDealPreview } from './_accept_deal_utils';
import { PROFIT_GRADE_STYLES } from './_offer_styles';

type DealOutcome = 'positive' | 'negative' | 'neutral';

function getDealOutcome(profitAmount: number): DealOutcome {
  if (profitAmount > 0) return 'positive';
  if (profitAmount < 0) return 'negative';
  return 'neutral';
}

function getProfitPercent(offerPrice: number, marketPrice: number): number {
  if (marketPrice === 0) return 0;
  return (Math.abs(offerPrice - marketPrice) / marketPrice) * 100;
}

function TopbarGrade({ grade }: { grade: profit_grade }) {
  const style = PROFIT_GRADE_STYLES[grade];
  return (
    <span className={`property-sale-modal__grade ${style.badge}`} aria-label={`Категория ${grade}`}>
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
  const outcome = getDealOutcome(preview.profitAmount);
  const percent = getProfitPercent(offer.offerPrice, offer.marketPrice).toFixed(1).replace('.', ',');
  const absProfit = Math.abs(preview.profitAmount);
  const primaryLabel = preview.isPurchase ? 'К оплате' : 'Вы получите';

  const statusLabel =
    outcome === 'positive'
      ? preview.isPurchase
        ? 'Выгодная покупка'
        : 'Выгодная сделка'
      : outcome === 'negative'
        ? preview.isPurchase
          ? 'Выше рынка'
          : 'Ниже рынка'
        : 'По рыночной цене';

  const benefitText =
    outcome === 'positive'
      ? preview.isPurchase
        ? `▼ −${formatMoney(absProfit)} · на ${percent}% ниже рынка`
        : `▲ +${formatMoney(absProfit)} · на ${percent}% выше рынка`
      : outcome === 'negative'
        ? preview.isPurchase
          ? `▲ +${formatMoney(absProfit)} · на ${percent}% выше рынка`
          : `▼ −${formatMoney(absProfit)} · на ${percent}% ниже рынка`
        : 'Без отклонения от рынка';

  return (
    <section className="property-sale-modal__offer" aria-label="Условия сделки">
      <span className={`property-sale-modal__offer-status property-sale-modal__offer-status--${outcome}`}>
        {statusLabel}
      </span>

      <p className="property-sale-modal__offer-label">{primaryLabel}</p>
      <div className="property-sale-modal__offer-value">
        <MoneyValue amount={offer.offerPrice} size="2xl" color="amber" className="!text-[inherit]" />
      </div>

      <p className="property-sale-modal__market-reference">
        Рыночная цена:{' '}
        <MoneyValue amount={offer.marketPrice} size="sm" color="muted" className="inline-flex" />
      </p>

      <p className={`property-sale-modal__benefit property-sale-modal__benefit--${outcome}`}>
        <TrendArrowIcon
          up={outcome === 'positive'}
          className={`h-3.5 w-3.5 shrink-0 ${
            outcome === 'positive'
              ? 'text-emerald-400'
              : outcome === 'negative'
                ? 'text-rose-400'
                : 'text-slate-400'
          }`}
        />
        <span>{benefitText}</span>
      </p>
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
  const deltaClass =
    delta > 0
      ? 'property-sale-modal__reputation-delta--positive'
      : delta < 0
        ? 'property-sale-modal__reputation-delta--negative'
        : 'property-sale-modal__reputation-delta--neutral';
  const deltaLabel =
    delta > 0 ? `+${delta.toFixed(1)}` : delta < 0 ? delta.toFixed(1) : 'Без изменений';

  return (
    <section className="property-sale-modal__reputation" aria-label="Репутация после сделки">
      <div className="property-sale-modal__reputation-label">
        <StarIcon className="h-3.5 w-3.5 text-amber-400" aria-hidden />
        Репутация после сделки
      </div>

      <div className="property-sale-modal__reputation-row">
        <div className="property-sale-modal__reputation-values">
          <span>{previousReputation.toFixed(1)}</span>
          <span className="property-sale-modal__reputation-arrow">→</span>
          <span>{reputation.toFixed(1)}</span>
        </div>
        <span className={`property-sale-modal__reputation-delta ${deltaClass}`}>{deltaLabel}</span>
      </div>

      <div className="property-sale-modal__reputation-bar">
        <SkillSegmentBar filled={filled} total={10} size="sm" className="justify-start gap-1" />
      </div>
    </section>
  );
}

export function AcceptDealPreviewView({
  offer,
  preview,
  reputation,
  image,
  confirming,
  controlsLocked,
  onClose,
  onConfirm,
}: {
  offer: PropertyOffer;
  preview: AcceptDealPreview;
  reputation: number;
  image: string | undefined;
  confirming: boolean;
  controlsLocked: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const isPurchase = preview.isPurchase;
  const dealType = isPurchase ? 'buy' : 'sell';
  const actionVerb = isPurchase ? 'Купить' : 'Продать';

  return (
    <>
      <header className="property-sale-modal__topbar">
        <div className="property-sale-modal__operation">
          <DealArrowIcon direction={dealType} className="property-sale-modal__operation-icon" />
          <span className="property-sale-modal__operation-label">
            {isPurchase ? 'Покупка имущества' : 'Продажа имущества'}
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
          <div className="property-sale-modal__asset-stage">
            <div className="property-sale-modal__asset-floor" aria-hidden />
            {image ? (
              <img
                src={image}
                alt={offer.itemName}
                className="property-sale-modal__asset-image"
              />
            ) : (
              <div className="flex h-full min-h-[12rem] items-center justify-center text-5xl">🏠</div>
            )}
          </div>
          <div className="property-sale-modal__visual-meta">
            Категория {offer.profitGrade}
          </div>
        </div>

        <div className="property-sale-modal__details">
          <header className="property-sale-modal__heading">
            <h2 id="accept-deal-title" className="property-sale-modal__heading-title">
              {offer.itemName}
            </h2>
            <p className="property-sale-modal__heading-subtitle">
              {isPurchase
                ? 'Подтвердите покупку по текущему предложению'
                : 'Подтвердите продажу по текущему предложению'}
            </p>
          </header>

          <OfferBlock offer={offer} preview={preview} />

          {preview.installmentBreakdown ? (
            <div className="property-sale-modal__note">
              Рассрочка: получите{' '}
              <MoneyValue
                amount={preview.installmentBreakdown.saleProceeds}
                size="sm"
                color="white"
                className="inline-flex font-semibold"
              />
              , остаток спишется при продаже
            </div>
          ) : null}

          {isPurchase && preview.downPaymentAmount !== null ? (
            <div className="property-sale-modal__note">
              Первоначальный взнос от {offer.downPaymentPercent}%:{' '}
              <MoneyValue
                amount={preview.downPaymentAmount}
                size="sm"
                color="white"
                className="inline-flex font-semibold"
              />
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
          variant={isPurchase ? 'emerald' : 'action'}
          size="sm"
          fullWidth
          disabled={controlsLocked}
          onClick={onConfirm}
          className="property-sale-modal__footer-btn property-sale-modal__confirm-btn"
        >
          {confirming ? (
            <span>{isPurchase ? 'Покупка…' : 'Продажа…'}</span>
          ) : (
            <>
              <span>{actionVerb}</span>
              <span className="opacity-60">·</span>
              <span className="property-sale-modal__confirm-amount">{formatMoney(offer.offerPrice)}</span>
            </>
          )}
        </GameButton>
      </footer>
    </>
  );
}
