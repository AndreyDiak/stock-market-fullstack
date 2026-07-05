import { REAL_ESTATE_CATALOG } from '../../../../constants/realEstate'
import { SALARY_CYCLE_TURNS } from '../../_model/constants'
import type { PropertySlot } from '../property'
import { calcPropertyPassiveIncome } from '../property'

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

export const EMPTY_NEXT_TURN_FORECAST: NextTurnForecast = {
  lines: [],
  incomeTotal: 0,
  expenseTotal: 0,
  netChange: 0,
}

function isSalaryTurn(step: number): boolean {
  return step > 0 && step % SALARY_CYCLE_TURNS === 0
}

function catalogPayment(itemRef: string) {
  return REAL_ESTATE_CATALOG.find((item) => item.id === itemRef)?.monthlyPayment ?? 0
}

function buildPropertyIncomeLines(slots: PropertySlot[]): TurnCashflowLine[] {
  const lines: TurnCashflowLine[] = []

  for (const slot of slots) {
    const item = slot.item
    if (!item || item.income <= 0) continue

    lines.push({
      id: `passive-income-${slot.id}`,
      label: item.name,
      amount: item.income,
    })
  }

  return lines
}

function replacePassiveIncomeLines(
  lines: TurnCashflowLine[],
  propertySlots: PropertySlot[],
): TurnCashflowLine[] {
  if (!lines.some((line) => line.id === 'passive-income')) {
    return lines
  }

  const incomeLines = buildPropertyIncomeLines(propertySlots)
  if (incomeLines.length === 0) {
    return lines
  }

  return [...lines.filter((line) => line.id !== 'passive-income'), ...incomeLines]
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
  forecast: NextTurnForecast | undefined,
  loanPaymentPerTurn: number,
): NextTurnForecast {
  if (!forecast) {
    return loanPaymentPerTurn > 0
      ? summarizeForecast([
          {
            id: 'loan-payments',
            label: 'Платежи по кредитам',
            amount: -loanPaymentPerTurn,
          },
        ])
      : EMPTY_NEXT_TURN_FORECAST
  }

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
    lines.push(...buildPropertyIncomeLines(input.propertySlots))
  }

  for (const slot of input.propertySlots) {
    if (!slot.item || slot.item.isOwned) continue
    const payment = slot.item.monthlyPayment ?? catalogPayment(slot.item.itemRef)
    if (payment <= 0) continue

    lines.push({
      id: `installment-${slot.id}`,
      label: `Рассрочка: ${slot.item.name}`,
      amount: -payment,
    })
  }

  return summarizeForecast(lines)
}

export function resolveNextTurnForecast(
  input: {
    step: number
    salary: number
    propertySlots: PropertySlot[]
    loanPaymentPerTurn: number
  },
  apiForecast?: NextTurnForecast,
): NextTurnForecast {
  const base =
    apiForecast ??
    buildNextTurnForecast({
      step: input.step,
      salary: input.salary,
      propertySlots: input.propertySlots,
    })

  const withPropertyIncomeLabels = summarizeForecast(
    replacePassiveIncomeLines(base.lines, input.propertySlots),
  )

  return appendLoanToForecast(withPropertyIncomeLabels, input.loanPaymentPerTurn)
}
