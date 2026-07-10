import { Profession } from '@prisma/client';

interface NpcItemSeed {
  itemRef: string;
  installmentsPaid: number;
}

export interface NpcSeed {
  name: string;
  profession: Profession;
  professionLevel: number;
  tradingLevel: number;
  salary: number;
  balance: number;
  items: NpcItemSeed[];
  dreams: string[];
}

export const NPCS: NpcSeed[] = [
  {
    name: 'Иваныч',
    profession: Profession.STREET_CLEANER,
    professionLevel: 1,
    tradingLevel: 1,
    salary: 1600,
    balance: 7500,
    items: [{ itemRef: 'old_garage', installmentsPaid: 5 }],
    dreams: ['trade_pavilion', 'car_wash'],
  },
  {
    name: 'Петрович',
    profession: Profession.FARMER,
    professionLevel: 1,
    tradingLevel: 1,
    salary: 2400,
    balance: 12000,
    items: [{ itemRef: 'garage', installmentsPaid: 6 }],
    dreams: ['tractor', 'combine_harvester'],
  },
  {
    name: 'Сергей',
    profession: Profession.ENGINEER,
    professionLevel: 1,
    tradingLevel: 2,
    salary: 4000,
    balance: 18000,
    items: [{ itemRef: 'garage', installmentsPaid: 6 }],
    dreams: ['sport_car', 'country_house'],
  },
  {
    name: 'Алекс',
    profession: Profession.DEVELOPER,
    professionLevel: 3,
    tradingLevel: 4,
    salary: 9000,
    balance: 42000,
    items: [{ itemRef: 'apartment', installmentsPaid: 15 }],
    dreams: ['trip', 'penthouse'],
  },
  {
    name: 'Марк',
    profession: Profession.FINANCIER,
    professionLevel: 1,
    tradingLevel: 3,
    salary: 10500,
    balance: 56000,
    items: [{ itemRef: 'apartment', installmentsPaid: 15 }],
    dreams: ['yacht', 'expensive_painting'],
  },
  {
    name: 'Борис',
    profession: Profession.DOCTOR,
    professionLevel: 1,
    tradingLevel: 2,
    salary: 12000,
    balance: 62000,
    items: [{ itemRef: 'apartment', installmentsPaid: 15 }],
    dreams: ['penthouse', 'apartment'],
  },
];
