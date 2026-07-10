import { Profession } from '@prisma/client';

export type AssetRef = string;

export interface DreamStageRequirement {
  description: string;
  minBalance?: number;
  minPortfolioValue?: number;
  minPassiveIncome?: number;
  minReputation?: number;
  minProfessionLevel?: number;
  minTradingLevel?: number;
  minBankingLevel?: number;
  requiredItems?: AssetRef[];
  requireItemFullyOwned?: AssetRef[];
  noActiveInstallments?: boolean;
}

export interface DreamDefinition {
  dreamType: string;
  title: string;
  description: string;
  stages: DreamStageRequirement[];
}

type ProfessionDreamMap = Partial<Record<Profession, DreamDefinition>>;

export const PROFESSION_DREAMS: ProfessionDreamMap = {
  [Profession.STREET_CLEANER]: {
    dreamType: 'OWN_BUSINESS',
    title: 'Свой бизнес',
    description: 'Откройте собственное дело и станьте независимым предпринимателем',
    stages: [
      {
        description: 'Накопить стартовый капитал и получить базовое образование',
        minBalance: 10000,
        minProfessionLevel: 2,
      },
      {
        description: 'Сделать первый шаг к собственному делу и приобрести небольшой коммерческий актив',
        minBalance: 15000,
        minPassiveIncome: 500,
        requiredItems: ['trade_pavilion'],
        requireItemFullyOwned: ['trade_pavilion'],
      },
      {
        description: 'Укрепить репутацию и создать финансовый запас для расширения бизнеса',
        minPortfolioValue: 50000,
        minReputation: 5,
        minTradingLevel: 2,
      },
      {
        description: 'Открыть собственный бизнес и выйти на стабильный пассивный доход',
        minBalance: 80000,
        minPassiveIncome: 1200,
        minReputation: 6,
        requiredItems: ['car_wash'],
        requireItemFullyOwned: ['car_wash'],
      },
    ],
  },
  [Profession.FARMER]: {
    dreamType: 'FINANCIAL_FREEDOM',
    title: 'Финансовая свобода',
    description: 'Достигните уровня, когда деньги работают на вас',
    stages: [
      {
        description: 'Создать финансовую подушку и повысить квалификацию',
        minBalance: 15000,
        minProfessionLevel: 2,
      },
      {
        description: 'Купить трактор и освоить базовые финансовые инструменты',
        minBalance: 20000,
        minBankingLevel: 2,
        requiredItems: ['tractor'],
        requireItemFullyOwned: ['tractor'],
      },
      {
        description: 'Собрать хозяйственную базу и начать получать стабильный доход',
        minPassiveIncome: 800,
        minReputation: 5,
        requiredItems: ['country_house', 'garage'],
        requireItemFullyOwned: ['country_house', 'garage'],
      },
      {
        description: 'Выйти на крупный уровень хозяйства и приобрести комбайн',
        minBalance: 150000,
        minPortfolioValue: 150000,
        minPassiveIncome: 1800,
        requiredItems: ['combine_harvester', 'warehouse'],
        requireItemFullyOwned: ['combine_harvester', 'warehouse'],
      },
    ],
  },
  [Profession.ENGINEER]: {
    dreamType: 'DREAM_HOUSE',
    title: 'Дом мечты',
    description: 'Постройте идеальное жильё для себя и семьи',
    stages: [
      {
        description: 'Подкопить на первый взнос и прокачать профессиональные навыки',
        minBalance: 20000,
        minProfessionLevel: 2,
      },
      {
        description: 'Купить первый загородный актив и начать инвестировать',
        minBalance: 10000,
        minPortfolioValue: 25000,
        requiredItems: ['country_house'],
        requireItemFullyOwned: ['country_house'],
      },
      {
        description: 'Улучшить жилищные условия и укрепить репутацию',
        minBalance: 50000,
        minReputation: 5,
        requiredItems: ['apartment'],
        requireItemFullyOwned: ['apartment'],
      },
      {
        description: 'Собрать техническую базу для комфортной жизни',
        minBalance: 30000,
        minPortfolioValue: 80000,
        requiredItems: ['garage', 'car'],
        requireItemFullyOwned: ['garage', 'car'],
      },
      {
        description: 'Воплотить мечту о высоком уровне жизни и личном пространстве',
        minBalance: 150000,
        minPortfolioValue: 100000,
        minReputation: 8,
        requiredItems: ['penthouse', 'sport_car'],
        requireItemFullyOwned: ['penthouse', 'sport_car'],
      },
    ],
  },
  [Profession.DEVELOPER]: {
    dreamType: 'INVESTMENT_EMPIRE',
    title: 'Инвестиционная империя',
    description: 'Постройте капитал, который позволяет жить свободно',
    stages: [
      {
        description: 'Изучить рынок и сделать первые вложения',
        minBalance: 20000,
        minPortfolioValue: 10000,
        minProfessionLevel: 2,
      },
      {
        description: 'Углубиться в трейдинг и начать активно работать с рынком',
        minTradingLevel: 2,
        minPortfolioValue: 50000,
      },
      {
        description: 'Диверсифицировать портфель и укрепить финансовую базу',
        minPortfolioValue: 100000,
        minBankingLevel: 2,
        minReputation: 5,
        requiredItems: ['warehouse'],
        requireItemFullyOwned: ['warehouse'],
      },
      {
        description: 'Увеличить капитал и подготовиться к финансовой свободе',
        minBalance: 80000,
        minPortfolioValue: 200000,
        minReputation: 7,
      },
      {
        description: 'Построить капитал, который позволяет жить свободно и увидеть мир',
        minBalance: 200000,
        minPortfolioValue: 500000,
        minReputation: 9,
        requiredItems: ['trip'],
      },
    ],
  },
  [Profession.FINANCIER]: {
    dreamType: 'PREMIUM_ASSET',
    title: 'Премиальный актив',
    description: 'Станьте владельцем самых дорогих активов в игре',
    stages: [
      {
        description: 'Начать карьеру с крупного капитала и сильных финансовых навыков',
        minBalance: 50000,
        minBankingLevel: 2,
        minProfessionLevel: 2,
      },
      {
        description: 'Купить первый материальный актив и собрать стартовый портфель',
        minPortfolioValue: 50000,
        requiredItems: ['garage'],
        requireItemFullyOwned: ['garage'],
      },
      {
        description: 'Расширить портфель и приобрести коммерческий актив',
        minPortfolioValue: 150000,
        minTradingLevel: 3,
        requiredItems: ['warehouse'],
        requireItemFullyOwned: ['warehouse'],
      },
      {
        description: 'Выйти на уровень премиальной недвижимости и крупного капитала',
        minBalance: 150000,
        minReputation: 8,
        requiredItems: ['penthouse'],
        requireItemFullyOwned: ['penthouse'],
      },
      {
        description: 'Собрать премиальные активы и доказать статус крупного инвестора',
        minBalance: 300000,
        minPortfolioValue: 1000000,
        minReputation: 10,
        requiredItems: ['yacht', 'expensive_painting'],
        requireItemFullyOwned: ['yacht'],
      },
    ],
  },
  [Profession.DOCTOR]: {
    dreamType: 'FAMILY_CAPITAL',
    title: 'Семейный капитал',
    description: 'Обеспечьте будущее своей семьи надёжными активами',
    stages: [
      {
        description: 'Создать накопления и повысить квалификацию',
        minBalance: 25000,
        minProfessionLevel: 2,
      },
      {
        description: 'Купить первые семейные активы для стабильности',
        minBalance: 15000,
        requiredItems: ['country_house', 'garage'],
        requireItemFullyOwned: ['country_house', 'garage'],
      },
      {
        description: 'Инвестировать в акции и купить автомобиль',
        minPortfolioValue: 50000,
        requiredItems: ['car'],
        requireItemFullyOwned: ['car'],
      },
      {
        description: 'Купить квартиру и укрепить профессиональную репутацию',
        minBalance: 80000,
        minReputation: 7,
        requiredItems: ['apartment'],
        requireItemFullyOwned: ['apartment'],
      },
      {
        description: 'Обеспечить высокий уровень жизни и создать прочную финансовую базу для семьи',
        minBalance: 200000,
        minPortfolioValue: 300000,
        minPassiveIncome: 1000,
        noActiveInstallments: true,
        requiredItems: ['penthouse'],
        requireItemFullyOwned: ['penthouse'],
      },
    ],
  },
};
