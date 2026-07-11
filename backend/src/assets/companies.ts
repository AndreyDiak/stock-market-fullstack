import { MarketSector } from '@prisma/client';

export interface CompanyData {
  ticker: string;
  name: string;
  sector: MarketSector;
  description: string;
}

export const COMPANIES: CompanyData[] = [
  // ==========================================
  // TECHNOLOGY
  // ==========================================
  {
    ticker: 'ORCH',
    name: 'Orchard Systems',
    sector: MarketSector.TECHNOLOGY,
    description: 'Разработчик операционной системы OrchardOS. Известны закрытой экосистемой и премиальными ценами на устройства.',
  },
  {
    ticker: 'MAGE',
    name: 'Magellan Search',
    sector: MarketSector.TECHNOLOGY,
    description: 'Поисковая система и рекламный гигант. Их алгоритмы знают о вас больше, чем вы сами.',
  },
  {
    ticker: 'QUIK',
    name: 'QuikSocial',
    sector: MarketSector.TECHNOLOGY,
    description: 'Социальная сеть с короткими видео. Главный потребитель свободного времени человечества.',
  },
  {
    ticker: 'NOVA',
    name: 'Nova Semiconductor',
    sector: MarketSector.TECHNOLOGY,
    description: 'Производитель графических процессоров и чипов для игровых систем и дата-центров.',
  },
  {
    ticker: 'PRAC',
    name: 'Praxis AI',
    sector: MarketSector.TECHNOLOGY,
    description: 'Лидер в области искусственного интеллекта. Их языковые модели отвечают на вопросы, которые вы не задавали.',
  },
  {
    ticker: 'CLDY',
    name: 'CloudStack Solutions',
    sector: MarketSector.TECHNOLOGY,
    description: 'Облачная инфраструктура и хостинг. Половина интернета работает на их серверах.',
  },
  {
    ticker: 'BYTE',
    name: 'ByteGuard Security',
    sector: MarketSector.TECHNOLOGY,
    description: 'Кибербезопасность для корпораций. Защищают компании от утечек данных и хакерских атак.',
  },
  {
    ticker: 'NXUS',
    name: 'Nexus Technologies',
    sector: MarketSector.TECHNOLOGY,
    description: 'Корпоративные коммуникации и мессенджеры. Их платформу Nexus Teams используют в каждом втором офисе.',
  },

  // ==========================================
  // HEALTHCARE
  // ==========================================
  {
    ticker: 'VITA',
    name: 'VitaCore Pharmaceuticals',
    sector: MarketSector.HEALTHCARE,
    description: 'Крупный фармацевтический гигант. Производит лекарства от всего — от мигрени до редких заболеваний.',
  },
  {
    ticker: 'GENX',
    name: 'Genexa Biotech',
    sector: MarketSector.HEALTHCARE,
    description: 'Биотехнологическая компания, специализирующаяся на редактировании генома и персонализированной медицине.',
  },
  {
    ticker: 'CURA',
    name: 'CuraLife Sciences',
    sector: MarketSector.HEALTHCARE,
    description: 'Разработчик лекарств от орфанных заболеваний. Каждый препарат стоит целое состояние.',
  },
  {
    ticker: 'MEDA',
    name: 'MedAtlas Diagnostics',
    sector: MarketSector.HEALTHCARE,
    description: 'Производитель медицинского диагностического оборудования — от МРТ-сканеров до портативных анализаторов.',
  },
  {
    ticker: 'PULS',
    name: 'PulsePoint Health',
    sector: MarketSector.HEALTHCARE,
    description: 'Сеть частных клиник и медицинских центров по всей стране. Чисто, современно, дорого.',
  },
  {
    ticker: 'MNDL',
    name: 'MindLift Therapeutics',
    sector: MarketSector.HEALTHCARE,
    description: 'Платформа для психического здоровья: терапия онлайн, медитации и приложения для борьбы с тревожностью.',
  },

  // ==========================================
  // FINANCE
  // ==========================================
  {
    ticker: 'MERC',
    name: 'Mercury Capital',
    sector: MarketSector.FINANCE,
    description: 'Инвестиционный банк с Уолл-стрит. Консультируют сделки M&A и управляют активами на триллионы долларов.',
  },
  {
    ticker: 'NXGN',
    name: 'NexGen Payments',
    sector: MarketSector.FINANCE,
    description: 'Платёжная система и финтех-платформа. Их карты и терминалы принимают в каждой торговой точке.',
  },
  {
    ticker: 'COIN',
    name: 'CoinReach Exchange',
    sector: MarketSector.FINANCE,
    description: 'Криптовалютная биржа. Торговля биткоином, эфиром и сотнями альткоинов с мобильного телефона.',
  },
  {
    ticker: 'BLDR',
    name: 'Boulder Street Advisors',
    sector: MarketSector.FINANCE,
    description: 'Управляющая компания. Инвестируют консервативно и надёжно — для тех, кто думает о пенсии.',
  },
  {
    ticker: 'RBNH',
    name: 'Robinhood Financial',
    sector: MarketSector.FINANCE,
    description: 'Брокерская платформа нового поколения. Никаких комиссий, удобное приложение, высокие риски.',
  },
  {
    ticker: 'AXIA',
    name: 'Axia Insurance Group',
    sector: MarketSector.FINANCE,
    description: 'Страховая группа: здоровье, имущество, ответственность. Застрахуют практически всё.',
  },

  // ==========================================
  // AGRICULTURE
  // ==========================================
  {
    ticker: 'GRAN',
    name: 'Granary Holdings',
    sector: MarketSector.AGRICULTURE,
    description: 'Агропромышленный холдинг. Выращивают зерновые, масличные культуры и управляют цепочкой поставок по всему миру.',
  },
  {
    ticker: 'SEED',
    name: 'SeedPro Genetics',
    sector: MarketSector.AGRICULTURE,
    description: 'Разработчик генетически модифицированных семян. Их культуры устойчивы к засухе, вредителям и пестицидам.',
  },
  {
    ticker: 'VERT',
    name: 'VertiGrow Farms',
    sector: MarketSector.AGRICULTURE,
    description: 'Вертикальные фермы в городских условиях. Салат и зелень выращивают в многоэтажных теплицах на гидропонике.',
  },
  {
    ticker: 'IRIG',
    name: 'IrriTech Systems',
    sector: MarketSector.AGRICULTURE,
    description: 'Производитель умных ирригационных систем. Капельный полив с датчиками влажности и спутниковым мониторингом.',
  },
  {
    ticker: 'PROT',
    name: 'Proterra Organics',
    sector: MarketSector.AGRICULTURE,
    description: 'Производитель и дистрибьютор органических продуктов питания. Всё чистое, натуральное и с сертификатами.',
  },
  {
    ticker: 'AQUA',
    name: 'AquaHarvest',
    sector: MarketSector.AGRICULTURE,
    description: 'Аквакультурное хозяйство. Выращивают лосося, креветки и другие морепродукты в промышленных масштабах.',
  },

  // ==========================================
  // ENERGY
  // ==========================================
  {
    ticker: 'APEX',
    name: 'ApexPetro Energy',
    sector: MarketSector.ENERGY,
    description: 'Нефтяная корпорация. Разведка, добыча, переработка и продажа нефти и газа по всему миру.',
  },
  {
    ticker: 'SOLA',
    name: 'SolaGrid Renewables',
    sector: MarketSector.ENERGY,
    description: 'Оператор солнечных электростанций. Строят и обслуживают солнечные фермы в пустынях и на крышах.',
  },
  {
    ticker: 'AERO',
    name: 'Aerogen Wind Systems',
    sector: MarketSector.ENERGY,
    description: 'Производитель и оператор ветряных турбин. Их ветропарки видны за десятки километров.',
  },
  {
    ticker: 'ATOM',
    name: 'AtomGen Power',
    sector: MarketSector.ENERGY,
    description: 'Оператор атомных электростанций. Обеспечивают базовую нагрузку энергосети без выбросов CO2.',
  },
  {
    ticker: 'VOLT',
    name: 'VoltGrid Infrastructure',
    sector: MarketSector.ENERGY,
    description: 'Оператор электрических сетей и распределительной инфраструктуры. Энергия от станции до вашей розетки.',
  },
  {
    ticker: 'NVFS',
    name: 'NovaFusion Energy',
    sector: MarketSector.ENERGY,
    description: 'Исследовательская компания в области термоядерного синтеза. Обещают чистую энергию через десять лет.',
  },
  {
    ticker: 'DRFT',
    name: 'Drift Motors',
    sector: MarketSector.TECHNOLOGY,
    description: 'Производитель электромобилей и зарядной инфраструктуры. Конкурирует с традиционными автогигантами.',
  },
  {
    ticker: 'SYNB',
    name: 'SynBio Labs',
    sector: MarketSector.HEALTHCARE,
    description: 'Синтетическая биология и лабораторные тесты нового поколения.',
  },
  {
    ticker: 'LEND',
    name: 'LendFlow',
    sector: MarketSector.FINANCE,
    description: 'Микрокредитование и BNPL-сервисы для розничных покупателей.',
  },
  {
    ticker: 'HARV',
    name: 'HarvestOne Co-op',
    sector: MarketSector.AGRICULTURE,
    description: 'Кооператив фермеров с сетью переработки и экспортом зерна.',
  },
  {
    ticker: 'GRID',
    name: 'GridNova Storage',
    sector: MarketSector.ENERGY,
    description: 'Промышленные накопители энергии для солнечных и ветряных станций.',
  },
  {
    ticker: 'DATA',
    name: 'DataForge Analytics',
    sector: MarketSector.TECHNOLOGY,
    description: 'Big Data и аналитика для ритейла и логистики.',
  },
  {
    ticker: 'CARE',
    name: 'CareBridge Clinics',
    sector: MarketSector.HEALTHCARE,
    description: 'Сеть амбулаторных клиник с телемедициной и подпиской на обслуживание.',
  },
  {
    ticker: 'FUND',
    name: 'FundAxis Capital',
    sector: MarketSector.FINANCE,
    description: 'Фонд прямых инвестиций в технологические стартапы средней стадии.',
  },
  {
    ticker: 'SOIL',
    name: 'SoilSense Agro',
    sector: MarketSector.AGRICULTURE,
    description: 'Датчики почвы и платформа точного земледелия для фермеров.',
  },
  {
    ticker: 'HYDR',
    name: 'HydroCell Power',
    sector: MarketSector.ENERGY,
    description: 'Малые гидроэлектростанции и модульные решения для удалённых регионов.',
  },
];
