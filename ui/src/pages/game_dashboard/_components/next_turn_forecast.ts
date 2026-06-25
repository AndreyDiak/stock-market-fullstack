import { REAL_ESTATE_CATALOG } from '../../../constants/realEstate'
import { SALARY_CYCLE_TURNS } from '../_model/constants'
import type { PropertySlot } from './property_inventory_block'
import { calcPropertyPassiveIncome } from './property_inventory_block'

export interface TurnCashflowLine {
  id: string
  label: string
  /** Положительное — зачисление, отрицательное — списание */
  amount: number
}

export interface NextTurnForecast {
  lines: TurnCashflowLine[]
  incomeTotal: number
  expenseTotal: number
  netChange: number
}

function isSalaryTurn(step: number): boolean {
  return step > 0 && step % SALARY_CYCLE_TURNS === 0
}

function catalogPayment(itemRef: string) {
  return REAL_ESTATE_CATALOG.find((item) => item.id === itemRef)?.monthlyPayment ?? 0
}

function summarizeForecast(lines: TurnCashflowLine[]): NextTurnForecast {
  const incomeTotal = lines
    .filter((line) => line.amount > 0)
    .reduce((sum, line) => sum + line.amount, 0)
  const expenseTotal = lines
    .filter((line) => line.amount < 0)
    .reduce((sum, line) => sum + Math.abs(line.amount), 0)

  return {
    lines,
    incomeTotal,
    expenseTotal,
    netChange: incomeTotal - expenseTotal,
  }
}

export function appendLoanToForecast(
  forecast: NextTurnForecast,
  loanPaymentPerTurn: number,
): NextTurnForecast {
  if (loanPaymentPerTurn <= 0) return forecast

  const lines = [
    ...forecast.lines,
    {
      id: 'loan-payments',
      label: 'Платежи по кредитам',
      amount: -loanPaymentPerTurn,
    },
  ]

  return summarizeForecast(lines)
}

export function patchForecastSalary(
  forecast: NextTurnForecast,
  salary: number,
): NextTurnForecast {
  if (!forecast.lines.some((line) => line.id === 'salary')) {
    return forecast
  }

  const lines = forecast.lines.map((line) =>
    line.id === 'salary' ? { ...line, amount: salary } : line,
  )

  return summarizeForecast(lines)
}

export function buildNextTurnForecast(input: {
  step: number
  salary: number
  propertySlots: PropertySlot[]
  loanPaymentPerTurn?: number
}): NextTurnForecast {
  const lines: TurnCashflowLine[] = []

  if (isSalaryTurn(input.step) && input.salary > 0) {
    lines.push({
      id: 'salary',
      label: 'Зарплата',
      amount: input.salary,
    })
  }

  const passiveIncome = calcPropertyPassiveIncome(input.propertySlots)
  if (passiveIncome > 0) {
    lines.push({
      id: 'passive-income',
      label: 'Пассивный доход',
      amount: passiveIncome,
    })
  }

  for (const slot of input.propertySlots) {
    if (!slot.item) continue
    const payment = slot.item.monthlyPayment ?? catalogPayment(slot.item.itemRef)
    if (payment <= 0) continue

    lines.push({
      id: `installment-${slot.id}`,
      label: `Рассрочка: ${slot.item.name}`,
      amount: -payment,
    })
  }

  const loanPayment = input.loanPaymentPerTurn ?? 0
  if (loanPayment > 0) {
    lines.push({
      id: 'loan-payments',
      label: 'Платежи по кредитам',
      amount: -loanPayment,
    })
  }

  return summarizeForecast(lines)
}
