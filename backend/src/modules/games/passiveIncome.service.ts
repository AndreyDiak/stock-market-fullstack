import type { PrismaClient, Character, InventoryItem } from '@prisma/client';
import { REAL_ESTATE } from '../../assets/realEstate.js';
import type { RealEstateData } from '../../assets/realEstate.js';

type CharacterWithItems = Character & { inventoryItems: InventoryItem[] };

interface PassiveResult {
  salary: number;
  installmentTotal: number;
  passiveIncome: number;
  itemsPaidOff: string[];
  netChange: number;
}

export class PassiveIncomeService {
  constructor(private prisma: PrismaClient) {}

  async process(character: CharacterWithItems): Promise<PassiveResult> {
    const salary = character.salary;
    const installmentResult = this.calcInstallments(character.inventoryItems);
    const passiveIncome = this.calcPassiveIncome(character.inventoryItems);
    const netChange = salary - installmentResult.total + passiveIncome;

    await this.prisma.$transaction(async (tx) => {
      await tx.character.update({
        where: { id: character.id },
        data: {
          balance: { increment: netChange },
          totalEarned: { increment: salary + passiveIncome },
          totalSpent: { increment: installmentResult.total },
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
}
