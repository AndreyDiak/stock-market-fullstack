import type { Character, InventoryItem, PrismaClient } from '@prisma/client';
import { calcEffectiveSalary } from '../character_skills/_calculations.js';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import type { RealEstateData } from '../../assets/real_estate.js';
import { isSalaryTurn } from './_economy_constants.js';
import {
  generateLivingExpenses,
  sumLivingExpenses,
  type LivingExpenseReceipt,
} from './_generators/_living_expense.generator.js';
import { calcPaidLoanAmount, hasActiveInstallmentDebt } from '../property_offers/_deal.js';

type CharacterWithItems = Character & { inventoryItems: InventoryItem[] };

export interface InstallmentPaymentEvent {
  itemId: string;
  itemRef: string;
  itemName: string;
  amount: number;
  paidOff: boolean;
  installmentsPaidAfter: number;
  installmentsTotal: number | null;
}

export interface PassiveResult {
  salary: number;
  livingExpense: number;
  livingExpenseReceipts: LivingExpenseReceipt[];
  installmentTotal: number;
  installmentPayments: InstallmentPaymentEvent[];
  passiveIncome: number;
  itemsPaidOff: string[];
  netChange: number;
}

export interface TurnCashflowLine {
  id: string;
  label: string;
  amount: number;
}

export interface TurnForecast {
  lines: TurnCashflowLine[];
  incomeTotal: number;
  expenseTotal: number;
  netChange: number;
}

export class PassiveIncomeService {
  readonly #prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  async process(
    character: CharacterWithItems,
    step: number,
    gameId: string,
  ): Promise<PassiveResult> {
    const effectiveSalary = calcEffectiveSalary(character.salary, character.professionLevel);
    const salary = isSalaryTurn(step) ? effectiveSalary : 0;
    const livingExpenseReceipts = generateLivingExpenses(gameId, step);
    const livingExpense = sumLivingExpenses(livingExpenseReceipts);
    const installmentResult = this.calcInstallments(character.inventoryItems);
    const passiveIncome = this.calcPassiveIncome(character.inventoryItems);
    const netChange = salary - livingExpense - installmentResult.total + passiveIncome;

    await this.#prisma.$transaction(async (tx) => {
      for (const itemId of installmentResult.reconciledPaidOffIds) {
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: { isPaidOff: true },
        });
      }

      await tx.character.update({
        where: { id: character.id },
        data: {
          balance: { increment: netChange },
          totalEarned: { increment: salary + passiveIncome },
          totalSpent: { increment: livingExpense + installmentResult.total },
        },
      });

      for (const itemId of installmentResult.paidOffIds) {
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: {
            installmentsPaid: { increment: 1 },
            isPaidOff: true,
          },
        });
      }

      for (const itemId of installmentResult.incrementedIds) {
        await tx.inventoryItem.update({
          where: { id: itemId },
          data: {
            installmentsPaid: { increment: 1 },
          },
        });
      }
    });

    return {
      salary,
      livingExpense,
      livingExpenseReceipts,
      installmentTotal: installmentResult.total,
      installmentPayments: installmentResult.payments,
      passiveIncome,
      itemsPaidOff: installmentResult.paidOffIds,
      netChange,
    };
  }

  calcInstallments(items: InventoryItem[]): {
    total: number;
    paidOffIds: string[];
    incrementedIds: string[];
    reconciledPaidOffIds: string[];
    payments: InstallmentPaymentEvent[];
  } {
    let total = 0;
    const paidOffIds: string[] = [];
    const incrementedIds: string[] = [];
    const reconciledPaidOffIds: string[] = [];
    const payments: InstallmentPaymentEvent[] = [];

    for (const item of items) {
      if (!item.isInstallment || item.isPaidOff) continue;

      if (!hasActiveInstallmentDebt(item)) {
        reconciledPaidOffIds.push(item.id);
        continue;
      }

      const amount = item.monthlyPayment ?? 0;
      total += amount;

      const paidOff = Boolean(
        item.installmentsTotal && item.installmentsPaid + 1 >= item.installmentsTotal,
      );

      payments.push({
        itemId: item.id,
        itemRef: item.itemRef,
        itemName: item.name,
        amount,
        paidOff,
        installmentsPaidAfter: item.installmentsPaid + 1,
        installmentsTotal: item.installmentsTotal,
      });

      if (paidOff) {
        paidOffIds.push(item.id);
      } else {
        incrementedIds.push(item.id);
      }
    }

    return { total, paidOffIds, incrementedIds, reconciledPaidOffIds, payments };
  }

  async reconcilePaidOffInstallments(items: InventoryItem[]): Promise<InventoryItem[]> {
    const toReconcile = items.filter(
      (item) => item.isInstallment && !item.isPaidOff && !hasActiveInstallmentDebt(item),
    );

    if (toReconcile.length === 0) {
      return items;
    }

    await this.#prisma.inventoryItem.updateMany({
      where: { id: { in: toReconcile.map((item) => item.id) } },
      data: { isPaidOff: true },
    });

    const reconciledIds = new Set(toReconcile.map((item) => item.id));

    return items.map((item) =>
      reconciledIds.has(item.id) ? { ...item, isPaidOff: true } : item,
    );
  }

  calcPassiveIncome(items: InventoryItem[]): number {
    let total = 0;

    for (const item of items) {
      const template = REAL_ESTATE.find((r: RealEstateData) => r.id === item.itemRef);
      if (template?.special?.includes('пассивный доход')) {
        const match = template.special.match(/(\d+)\/ход/);
        if (match) {
          total += Number(match[1]);
        }
      }
    }

    return total;
  }

  buildForecast(
    character: Pick<Character, 'salary' | 'professionLevel'> & { inventoryItems: InventoryItem[] },
    step: number,
    gameId: string,
  ): TurnForecast {
    const lines: TurnCashflowLine[] = [];
    const effectiveSalary = calcEffectiveSalary(character.salary, character.professionLevel);

    if (isSalaryTurn(step) && effectiveSalary > 0) {
      lines.push({
        id: 'salary',
        label: 'Зарплата',
        amount: effectiveSalary,
      });
    }

    const passiveIncome = this.calcPassiveIncome(character.inventoryItems);
    if (passiveIncome > 0) {
      lines.push({
        id: 'passive-income',
        label: 'Пассивный доход',
        amount: passiveIncome,
      });
    }

    for (const receipt of generateLivingExpenses(gameId, step)) {
      lines.push({
        id: `living-${receipt.itemId}`,
        label: receipt.title,
        amount: -receipt.amount,
      });
    }

    for (const item of character.inventoryItems) {
      if (!hasActiveInstallmentDebt(item)) continue;

      const payment = item.monthlyPayment ?? 0;
      if (payment <= 0) continue;

      lines.push({
        id: `installment-${item.id}`,
        label: `Рассрочка: ${item.name}`,
        amount: -payment,
      });
    }

    const incomeTotal = lines
      .filter((line) => line.amount > 0)
      .reduce((sum, line) => sum + line.amount, 0);
    const expenseTotal = lines
      .filter((line) => line.amount < 0)
      .reduce((sum, line) => sum + Math.abs(line.amount), 0);

    return {
      lines,
      incomeTotal,
      expenseTotal,
      netChange: incomeTotal - expenseTotal,
    };
  }
}
