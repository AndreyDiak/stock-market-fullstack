import { MoneyValue } from '../../../../components/money/money_value';
import {
  calcDownPaymentAmount,
  getPurchaseInstallmentPlan,
  canAffordPurchase,
  type PropertyOfferPaymentMode,
} from './_accept_deal_utils';
import { format_turns_left_label } from '../../_model/utils';

interface PropertyPaymentModePickerProps {
  assetId: string;
  price: number;
  downPaymentPercent: number;
  interestRatePercent: number;
  balance: number;
  mode: PropertyOfferPaymentMode;
  onChange: (mode: PropertyOfferPaymentMode) => void;
}

export function PropertyPaymentModePicker({
  assetId,
  price,
  downPaymentPercent,
  interestRatePercent,
  balance,
  mode,
  onChange,
}: PropertyPaymentModePickerProps) {
  const downPayment = calcDownPaymentAmount(price, downPaymentPercent);
  const installmentPlan = getPurchaseInstallmentPlan(
    assetId,
    price,
    downPaymentPercent,
    interestRatePercent,
  );
  const canPayFull = canAffordPurchase(balance, price, downPaymentPercent, 'full');
  const canPayInstallment = canAffordPurchase(balance, price, downPaymentPercent, 'installment');

  return (
    <div className="property-sale-modal__payment-mode">
      <p className="property-sale-modal__payment-mode-label">Способ оплаты</p>
      <div className="property-sale-modal__payment-mode-options">
        <button
          type="button"
          className={[
            'property-sale-modal__payment-mode-option',
            mode === 'full' ? 'property-sale-modal__payment-mode-option--active' : '',
            !canPayFull ? 'property-sale-modal__payment-mode-option--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={!canPayFull}
          onClick={() => onChange('full')}
        >
          <span className="property-sale-modal__payment-mode-title">Полная оплата</span>
          <div className="property-sale-modal__payment-mode-details">
            <span className="property-sale-modal__payment-mode-line">
              <MoneyValue amount={price} size="sm" color="white" className="inline-flex" />
            </span>
            <span
              className="property-sale-modal__payment-mode-line property-sale-modal__payment-mode-line--placeholder"
              aria-hidden
            >
              &nbsp;
            </span>
          </div>
        </button>

        <button
          type="button"
          className={[
            'property-sale-modal__payment-mode-option',
            mode === 'installment' ? 'property-sale-modal__payment-mode-option--active' : '',
            !canPayInstallment ? 'property-sale-modal__payment-mode-option--disabled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          disabled={!canPayInstallment}
          onClick={() => onChange('installment')}
        >
          <span className="property-sale-modal__payment-mode-title">Ипотека</span>
          <div className="property-sale-modal__payment-mode-details">
            <span className="property-sale-modal__payment-mode-line">
              Взнос{' '}
              <MoneyValue amount={downPayment} size="sm" color="amber" className="inline-flex" />
            </span>
            {installmentPlan ? (
              <span className="property-sale-modal__payment-mode-line property-sale-modal__payment-mode-line--muted">
                {format_turns_left_label(installmentPlan.installmentsTotal)} по{' '}
                <MoneyValue
                  amount={installmentPlan.monthlyPayment}
                  size="sm"
                  color="muted"
                  suffix="/ход"
                  className="inline-flex"
                />
              </span>
            ) : (
              <span
                className="property-sale-modal__payment-mode-line property-sale-modal__payment-mode-line--placeholder"
                aria-hidden
              >
                &nbsp;
              </span>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
