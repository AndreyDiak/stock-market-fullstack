export interface InstallmentPurchasePlan {
  downPayment: number;
  installmentsTotal: number;
  monthlyPayment: number;
  totalWithInterest: number;
  overpayment: number;
  interestRatePercent: number;
}

export function calcInstallmentPurchasePlan(input: {
  purchasePrice: number;
  downPaymentPercent: number;
  installmentsTotal: number;
  interestRatePercent: number;
}): InstallmentPurchasePlan {  const downPayment = Math.round((input.purchasePrice * input.downPaymentPercent) / 100);
  const totalWithInterest = Math.round(
    input.purchasePrice * (1 + input.interestRatePercent / 100),
  );
  const remainingTotal = Math.max(0, totalWithInterest - downPayment);
  const installmentsTotal = Math.max(1, input.installmentsTotal);
  const monthlyPayment = Math.round(remainingTotal / installmentsTotal);

  return {
    downPayment,
    installmentsTotal,
    monthlyPayment,
    totalWithInterest,
    overpayment: totalWithInterest - input.purchasePrice,
    interestRatePercent: input.interestRatePercent,
  };
}

const DEFAULT_DOWN_PAYMENT_PERCENT = 15;

export function resolveDownPaymentAmount(item: {
  purchasePrice: number;
  downPaymentAmount: number | null;
  installmentsTotal: number | null;
  isInstallment: boolean;
  isPaidOff: boolean;
}): number {
  if (item.downPaymentAmount != null) {
    return item.downPaymentAmount;
  }

  if (!item.isInstallment || item.isPaidOff) {
    return 0;
  }

  const installmentsTotal = item.installmentsTotal ?? 0;
  if (installmentsTotal <= 0) {
    return 0;
  }

  return Math.round((item.purchasePrice * DEFAULT_DOWN_PAYMENT_PERCENT) / 100);
}

export function calcInstallmentTotalOwed(input: {
  purchasePrice: number;
  downPaymentAmount: number | null;
  monthlyPayment: number | null;
  installmentsTotal: number | null;
  isInstallment: boolean;
  isPaidOff: boolean;
}): number {
  if (!input.isInstallment) {
    return input.isPaidOff ? input.purchasePrice : 0;
  }

  if (input.monthlyPayment != null && input.installmentsTotal != null) {
    return resolveDownPaymentAmount(input) + input.monthlyPayment * input.installmentsTotal;
  }

  return input.purchasePrice;
}
