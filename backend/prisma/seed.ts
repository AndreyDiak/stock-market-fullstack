/// <reference types="node" />
import { PrismaClient, Profession } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { NPCS } from '../src/assets/npcs.js';
import { REAL_ESTATE } from '../src/assets/realEstate.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      yandexId: 'yandex-test-id-123',
      displayName: 'Test User',
      avatarUrl: 'https://example.com/avatar.png',
    },
  });

  const existingGame = await prisma.game.findFirst({
    where: { userId: user.id, slot: 1 },
  });

  if (!existingGame) {
    await prisma.game.create({
      data: {
        userId: user.id,
        name: 'Тестовая игра',
        slot: 1,
        startedAt: new Date(),
        character: {
          create: {
            name: 'Иван Трейдер',
            profession: Profession.DEVELOPER,
            salary: 3000,
            balance: 10000,
          },
        },
      },
    });
  }

  for (const npc of NPCS) {
    const exists = await prisma.character.findFirst({
      where: { name: npc.name, isNpc: true },
    });

    if (exists) continue;

    await prisma.character.create({
      data: {
        name: npc.name,
        profession: npc.profession,
        professionLevel: npc.professionLevel,
        salary: npc.salary,
        balance: npc.balance,
        savings: npc.savings,
        isNpc: true,
        inventoryItems: {
          create: npc.items.map((item) => {
            const template = REAL_ESTATE.find((r) => r.id === item.itemRef)!;
            return {
              itemRef: item.itemRef,
              name: template.name,
              purchasePrice: template.basePrice,
              isInstallment: true,
              monthlyPayment: template.monthlyPayment,
              installmentsTotal: template.installmentMonths,
              installmentsPaid: item.installmentsPaid,
              special: template.special,
            };
          }),
        },
      },
    });
  }

  const npcCount = await prisma.character.count({ where: { isNpc: true } });
  console.log('Seed completed:', { userId: user.id, npcsCreated: npcCount });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
