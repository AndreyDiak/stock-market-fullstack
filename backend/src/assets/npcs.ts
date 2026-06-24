import { Profession } from '@prisma/client';

interface NpcItemSeed {
  itemRef: string;
  installmentsPaid: number;
}

export interface NpcSeed {
  name: string;
  profession: Profession;
  professionLevel: number;
  salary: number;
  balance: number;
  savings: number;
  items: NpcItemSeed[];
  dreams: string[];
}

export const NPCS: NpcSeed[] = [
  {
    name: 'Иваныч',
    profession: Profession.STREET_CLEANER,
    professionLevel: 2,
    salary: 1600,
    balance: 4800,
    savings: 1200,
    items: [{ itemRef: 'old_garage', installmentsPaid: 5 }],
    dreams: ['car', 'garage'],
  },
  {
    name: 'Петрович',
    profession: Profession.FARMER,
    professionLevel: 2,
    salary: 2400,
    balance: 7500,
    savings: 3000,
    items: [{ itemRef: 'garage', installmentsPaid: 6 }],
    dreams: ['tractor', 'country_house'],
  },
  {
    name: 'Сергей',
    profession: Profession.ENGINEER,
    professionLevel: 2,
    salary: 4000,
    balance: 12000,
    savings: 5000,
    items: [
      { itemRef: 'garage', installmentsPaid: 6 },
      { itemRef: 'parking_spot', installmentsPaid: 8 },
    ],
    dreams: ['sport_car', 'country_house'],
  },
  {
    name: 'Алекс',
    profession: Profession.DEVELOPER,
    professionLevel: 3,
    salary: 9000,
    balance: 35000,
    savings: 15000,
    items: [{ itemRef: 'apartment', installmentsPaid: 15 }],
    dreams: ['penthouse', 'sport_car'],
  },
  {
    name: 'Марк',
    profession: Profession.FINANCIER,
    professionLevel: 3,
    salary: 10500,
    balance: 45000,
    savings: 20000,
    items: [
      { itemRef: 'apartment', installmentsPaid: 15 },
      { itemRef: 'parking_spot', installmentsPaid: 8 },
    ],
    dreams: ['yacht', 'penthouse', 'sport_car'],
  },
  {
    name: 'Борис',
    profession: Profession.DOCTOR,
    professionLevel: 3,
    salary: 12000,
    balance: 50000,
    savings: 25000,
    items: [{ itemRef: 'apartment', installmentsPaid: 15 }],
    dreams: ['trip', 'sport_car'],
  },
];
