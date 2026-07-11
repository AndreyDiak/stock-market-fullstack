import { MoneyValue } from '../../../../components/money/money_value';
import { useGameStore } from '../../../../stores/game.store';
import { format_turns_left_label } from '../../_model/utils';
import { getPurchaseInstallmentPlan } from './_accept_deal_utils';

export function InstallmentPlanCaption({
  assetId,
  purchasePrice,
  downPaymentPercent,
  interestRatePercent,
  className = '',
}: {
  assetId: string;
  purchasePrice: number;
  downPaymentPercent: number;
  interestRatePercent?: number;
  className?: string;
}) {
  const bankBaseRatePercent = useGameStore((state) => state.characterStats.bankBaseRatePercent);
  const plan = getPurchaseInstallmentPlan(
    assetId,
    purchasePrice,
    downPaymentPercent,
    interestRatePercent ?? bankBaseRatePercent,
  );
  if (!plan) return null;

  return (
    <p className={`text-[10px] leading-snug text-slate-400 ${className}`.trim()}>
      затем {format_turns_left_label(plan.installmentsTotal)} по{' '}
      <MoneyValue
        amount={plan.monthlyPayment}
        size="xs"
        color="muted"
        suffix="/ход"
        className="inline-flex align-middle"
      />
    </p>
  );
}
