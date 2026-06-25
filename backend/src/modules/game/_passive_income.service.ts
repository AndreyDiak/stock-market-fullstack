import type { PrismaClient, Character, InventoryItem } from '@prisma/client';
import { REAL_ESTATE } from '../../assets/real_estate.js';
import type { RealEstateData } from '../../assets/real_estate.js';
import { isSalaryTurn } from './_economy_constants.js';
import {
  generateLivingExpenses,
  sumLivingExpenses,
  type LivingExpenseReceipt,
} from './_generators/_living_expense.generator.js';

type CharacterWithItems = Character & { inventoryItems: InventoryItem[] };

export interface PassiveResult {
  salary: number;
  livingExpense: number;
  livingExpenseReceipts: LivingExpenseReceipt[];
  installmentTotal: number;
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
    const salary = isSalaryTurn(step) ? character.salary : 0;
    const livingExpenseReceipts = generateLivingExpenses(gameId, step);
    const livingExpense = sumLivingExpenses(livingExpenseReceipts);
    const installmentResult = this.calcInstallments(character.inventoryItems);
    const passiveIncome = this.calcPassiveIncome(character.inventoryItems);
    const netChange = salary - livingExpense - installmentResult.total + passiveIncome;

    await this.#prisma.$transaction(async (tx) => {
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
      passiveIncome,
      itemsPaidOff: installmentResult.paidOffIds,
      netChange,
    };
  }

  calcInstallments(items: InventoryItem[]): {
    total: number;
    paidOffIds: string[];
    incrementedIds: string[];
  } {
    let total = 0;
    const paidOffIds: string[] = [];
    const incrementedIds: string[] = [];

    for (const item of items) {
      if (!item.isInstallment || item.isPaidOff) continue;

      total += item.monthlyPayment ?? 0;
      incrementedIds.push(item.id);

      if (item.installmentsTotal && item.installmentsPaid + 1 >= item.installmentsTotal) {
        paidOffIds.push(item.id);
      }
    }

    return { total, paidOffIds, incrementedIds };
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
    character: Pick<Character, 'salary'> & { inventoryItems: InventoryItem[] },
    step: number,
    gameId: string,
  ): TurnForecast {
    const lines: TurnCashflowLine[] = [];

    if (isSalaryTurn(step) && character.salary > 0) {
      lines.push({
        id: 'salary',
        label: 'Зарплата',
        amount: character.salary,
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
      if (!item.isInstallment || item.isPaidOff) continue;

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
