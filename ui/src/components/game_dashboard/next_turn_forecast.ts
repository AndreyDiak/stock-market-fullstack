import { REAL_ESTATE_CATALOG } from '../../constants/realEstate'
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

function catalogPayment(itemRef: string) {
  return REAL_ESTATE_CATALOG.find((item) => item.id === itemRef)?.monthlyPayment ?? 0
}

export function buildNextTurnForecast(input: {
  salary: number
  propertySlots: PropertySlot[]
  loanPaymentPerTurn?: number
}): NextTurnForecast {
  const lines: TurnCashflowLine[] = []

  if (input.salary > 0) {
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
    const payment = catalogPayment(slot.item.itemRef)
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

  const incomeTotal = lines.filter((line) => line.amount > 0).reduce((sum, line) => sum + line.amount, 0)
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
