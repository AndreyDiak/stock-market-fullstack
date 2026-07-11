# Stock Market — Полная документация проекта

## Общая архитектура

**Stock Market** — это пошаговая экономическая игра с биржевой торговлей, недвижимостью, сделками с NPC и системой «мечты» (долгосрочных целей по профессии).

### Стек технологий
- **Backend**: Node.js + Fastify + TypeScript + Prisma (PostgreSQL) + Redis
- **Frontend**: React 19 + Vite + TailwindCSS 4 + Zustand + React Router 7
- **API**: OpenAPI + openapi-typescript (генерация типов)
- **Real-time**: Не используется (polling-based)

---

## Backend — Модули и функциональность

### 1. Игровой цикл (`backend/src/modules/game/`)

#### Фазы хода (Turn Pipeline)
Каждый ход проходит через последовательность фаз в `createGamePipeline()`:

| Фаза | Файл | Назначение |
|------|------|------------|
| `advance-step` | `_phases/_advance_step.phase.ts` | Инкремент `game.step`, проверка завершения игры |
| `economy` | `_phases/_economy.phase.ts` | Зарплата, расходы на жизнь, выплаты по рассрочкам, пассивный доход |
| `market-turn` | `_phases/_market_turn.phase.ts` | Обновление цен акций, секторный моментум, настроения, дивиденды |
| `turn-content` | `_phases/_turn_content.phase.ts` | Генерация контента: новости / сделки / недвижимость (цикл 3 хода) |
| `property-offers-expiry` | `_phases/_property_offers_expiry.phase.ts` | Деактивация просроченных офферов недвижимости |

#### Генерация контента хода (`TurnContentPhase`)
Строгий цикл: **stock → deal → property** (каждый 3-й ход).
- `stock` (базовый): генерация рыночной новости / слуха / инсайда
- `deal` (каждый 3-й): `DealGenerator.maybeGenerate()` — bundle-to-bundle обмен с NPC
- `property` (каждый 3-й): `PropertyOffersService.createWithNews()` — предложение купли/продажи недвижимости

#### Экономика хода (`PassiveIncomeService.process()`)
- **Зарплата**: выплачивается каждый 3-й ход (`isSalaryTurn(step)`), учитывает `professionLevel` (+10%/уровень)
- **Расходы на жизнь**: случайные чеки (`generateLivingExpenses`)
- **Рассрочки**: ежемесячные платежи по ипотеке/кредитам
- **Пассивный доход**: парсится из `special` поля инвентаря (`пассивный доход X/ход`)
- **Итог**: `netChange = salary - livingExpense - installmentTotal + passiveIncome`

#### Основные сервисы
- `GameService` — оркестратор: `endTurn()`, `getDashboard()`, `acceptPropertyOffer()`, `acceptDeal()`, `upgradeSkill()`, `payOffInstallment()`
- `PassiveIncomeService` — расчёт денежного потока, прогноз следующего хода (`buildForecast()`)

---

### 2. Биржа и рынок (`backend/src/modules/market/`)

#### Акции
- **Компании**: 30 компаний в `assets/companies.ts` (6 секторов × 5 тикеров)
- **Грейды**: F → E → D → C → B → A (конфиг в `assets/stock_grade.ts`)
- **Архетипы**: комбинация сектор + грейд + дивиденды → поведение цены (`stock_archetype.ts`)
- **Ценообразование**: `calculateNextPrice()` — базовая волатильность + новости + секторный моментум + общее настроение

#### Дивиденды (`DividendService`)
- Профиль дивидендов роллится при листинге: `yield%`, `frequency` (ходов), `growthRate`
- Выплата: `calcDividendPerShare(price, yieldPct)` → начисляется на баланс владельцев

#### IPO (`IPOManager`)
- Анонс → подписка → размещение → листинг на бирже
- Минимум/максимум подписки, окно в ходах

#### Маркет-сентимент
- Глобальный `value` [-1, 1], обновляется каждый ход (`processSentimentTurn`)
- Индикатор: `bullish` / `bearish` / `neutral`

#### Секторный моментум
- По секторам: `value`, `duration`, `trend` (rising/falling/neutral)
- Затухание каждый ход (`decaySectorMomentum`)

#### Давление новостей (`NewsImpactService`)
- Новости создают `NewsPressure` на тикеры/сектора
- Затухание `remainingTurns` и `impact` каждый ход

---

### 3. Сделки с NPC (`backend/src/modules/deals/`)

#### Типы сделок (шаблоны в `deal.builder.ts`)
| Тип | Вес | Описание |
|-----|-----|----------|
| `CASH_FOR_STOCK` | 3 | Бот даёт кэш → игрок даёт 5–30 акций случайной компании |
| `PROPERTY_FOR_CASH` | 2 | Бот даёт недвижимость → игрок даёт кэш |
| `MIXED_BUNDLE` | 2 | Бот даёт акции (3–15) + кэш (2000–15000) + опц. недвижимость |
| `STOCK_PACKAGE` | 1 | Пакет акций за кэш |
| `DREAM_HELPER` | 1 | Бот даёт предмет мечты игрока |
| `LIQUIDITY` | 1 | Быстрый обмен ликвидности |

#### Генерация (`DealGenerator.maybeGenerate()`)
1. Выбор случайного NPC (`isNpc: true`, без `gameId`)
2. До 24 попыток построить сделку через `buildDealWithRetries()`
3. Валидация: игрок может отдать ассеты, NPC имеет ассеты, выгода в разумных пределах
4. Fallback: `buildGuaranteedDeal()` — всегда генерирует валидную сделку

#### Параметры сделки
- `requiredReputation = clamp(player.reputation × 0.7, 1, 10)`
- `requiredTradingLevel` — зависит от типа сделки и грейдов акций
- `expiresInTurns = 2–4`
- `playerBenefitPercent` — % выгоды игрока (зелёный/красный в UI)
- `reputationPenalty` — штраф репутации при плохой сделке

#### Принятие сделки (`DealService.accept()`)
1. Проверки: `ACTIVE`, не просрочена, репутация ≥ required, tradingLevel ≥ required
2. Валидация ассетов игрока (`#validatePlayerCanGive`):
   - `CASH`: баланс ≥ сумма
   - `STOCK`: тикер и кол-во в портфеле
   - `PROPERTY`: предмет в инвентаре, `!isInstallment || isPaidOff`
3. Транзакция: списание (`#executeGive`) + зачисление (`#executeReceive`) + обновление репутации/статистики
4. Статус → `ACCEPTED`, создаётся новость `DEAL_OFFER`

#### Хранение (Prisma: `DealOffer`)
- `botGives` / `playerGives` (JSON: `DealBundle` — массив ассетов с `type`, `cashAmount`, `ticker/shares`, `propertyId/estimatedValue`)
- `requiredReputation`, `requiredTradingLevel`, `reputationPenalty`
- `playerBenefitValue`, `playerBenefitPercent`
- `status`: `ACTIVE` | `ACCEPTED` | `REJECTED` | `EXPIRED`
- `turnCreated`, `expiresTurn`

---

### 4. Недвижимость (`backend/src/modules/property_offers/`)

#### Типы офферов
- `SELL` — бот покупает у игрока (игрок должен владеть предметом, без активной рассрочки)
- `BUY` — бот продаёт игроку (новый предмет в инвентарь)

#### Генерация (`PropertyOffersService.createOffers()`)
- Параметры: `buildOfferParams()` — выбирает ассет из `REAL_ESTATE`, считает цену с наваром/скидкой
- Грейды прибыльности: `F` (убыток) → `A` (макс. прибыль) — влияет на `requiredBankingLevel` и `% первоначального взноса`
- `expiresInTurns = 3–6`, `isHot` (редкие выгодные)

#### Переговоры (`_negotiate.ts`)
- Игрок предлагает `%` корректировки цены (clamp: SELL [-50%, +10%], BUY [-10%, +50%])
- `tradingLevel` улучшает условия (`normalizeNegotiatePercent`)
- D20 бросок: `roll = d20 + floor(reputation)`, `target` зависит от типа и % корректировки
- Успех → `pendingNegotiatedPrice` сохраняется, можно принять
- Провал → -0.1 репутации, сбрейк streak

#### Приобретение в рассрочку (`_installment_purchase.ts`, `_deal.ts`)
- `% взноса` по грейду: F=50%, E=40%, D=30%, C=20%, B=15%, A=10%
- `bankingLevel` снижает месячный платёж (рефинансирование)
- План: `calcInstallmentPurchasePlan({ purchasePrice, downPaymentPercent, installmentsTotal, bankingLevel })`

#### Продажа с рассрочкой (`_deal.ts`)
- `calcInstallmentSaleBreakdown(owned, salePrice)` — расчёт: остаток долга, выплата/доплата, чистая сумма на баланс
- `calcSaleBalanceCredit(owned, price)` — сколько реально зачислится

#### Досрочное погашение (`payOffInstallment()`)
- `%` от остатка долга, лимит — баланс игрока
- `applyEarlyInstallmentPayment()` — пересчёт `installmentsPaid`, `isPaidOff`, `installmentPrepay`

---

### 5. OTC-сделки (`backend/src/modules/otc_deals/`)

- Генерируются в `turn-content` фазе (через `_generators/_otc_deal.generator.ts`)
- Бот предлагает купить/продать акции по фиксированной цене на N ходов
- `OtcDealsService.accept()` — сразу исполняет сделку, создаёт новость `STOCK_TRADE`

---

### 6. Мечта / Dream (`backend/src/modules/dreams/`)

#### Определения (`assets/dreams.ts`)
6 профессий × 4–5 этапов:
| Профессия | Мечта | Финальные требования |
|-----------|-------|---------------------|
| `STREET_CLEANER` | Свой бизнес | 100k баланса, 150k портфеля, реп 7, пентхаус, спорткар |
| `FARMER` | Финансовая свобода | Пассив 3000, портфель 200k, реп 8 |
| `ENGINEER` | Дом мечты | Дом, участок, портфель 100k |
| `DEVELOPER` | Инвестиционная империя | Портфель 300k, 3+ свойства, реп 9 |
| `FINANCIER` | Премиальный актив | Пентхаус, спорткар, яхта, портфель 500k |
| `DOCTOR` | Семейный капитал | Портфель 250k, дом, квартира, реп 8 |

#### Требования этапа (`DreamStageRequirement`)
- Финансовые: `minBalance`, `minPortfolioValue`, `minPassiveIncome`, `minReputation`
- Уровни: `minProfessionLevel`, `minTradingLevel`, `minBankingLevel`
- Активы: `requiredItems[]`, `requireItemFullyOwned[]` (ссылки на `REAL_ESTATE`)
- `noActiveInstallments` — запрет активных рассрочек

#### Логика (`DreamService`)
- `getDream()` — находит/создаёт Dream в БД, вычисляет `portfolioValue` (∑ qty × purchasePrice) и `passiveIncome`, назначает статусы этапам:
  - `COMPLETED` (в БД или index < currentStage)
  - `LOCKED` (index > currentStage)
  - `READY_TO_COMPLETE` (требования выполнены)
  - `ACTIVE` (текущий)
- `completeStage()` — валидация требований, инкремент `currentStage`
- `fulfillDream()` — проверка финального этапа → `game.status = 'COMPLETED'`

#### API
| Маршрут | Метод | Ответ |
|---------|-------|-------|
| `/saves/:id/dream` | GET | `DreamResponse` |
| `/saves/:id/dream/complete-stage` | POST | `DreamResponse` |
| `/saves/:id/dream/fulfill` | POST | `{ success: true }` |

---

### 7. Навыки персонажа (`backend/src/modules/character_skills/`)

#### 4 навыка (`_definitions.ts`)
| ID | Название | Макс. уровень | Эффект |
|----|----------|---------------|--------|
| `qualification` | Повышение квалификации | 10 | +10% зарплата/ур., +2% шанс инсайда/ур. |
| `banking` | Курсы банковского дела | 6 | -2% ставка кредитов/ур., доступ к грейдам F→A недвижимости |
| `trading` | Курс трейдинга | 6 | Комиссия продажи: 10%→5%, торг по имуществу до 50% |
| `property_slots` | Слоты имущества | 4 | Разблокирует следующий слот (макс. 4 активных) |

#### Прогрессия (`_calculations.ts`, `_state.ts`)
- Цена апгрейда: `basePrice * (level^1.5)` + зависимость от зарплаты
- `propertySlotLevel` → `countUnlockedPropertySlots()`: 1→1, 2→2, 3→3, 4→4
- `effectiveSalary = salary * (1 + 0.1 * (professionLevel - 1))`

#### Сервис (`CharacterSkillsService`)
- `buildState(character)` → `CharacterSkillsState` (skills[] + stats)
- `upgradeSkill(userId, saveId, skillId)` — проверка баланса, списание, инкремент уровня в Character

---

### 8. Новости (`backend/src/modules/news/`)

#### Виды новостей (`types.ts`)
`WELCOME` | `MARKET` | `INSIDER` | `RUMOR` | `OTC_DEAL` | `DEAL_OFFER` | `PROPERTY_OFFER` | `PROPERTY_DEAL` | `PROPERTY_INSTALLMENT` | `STOCK_TRADE` | `STOCK_DIVIDEND`

#### Генерация (`NewsGenerationService`)
- Цикл: каждые 3 хода гарантированно генерируется контент из `TURN_CYCLE_NEWS_KINDS`
- Инсайдер: шанс `professionLevel * 2%` (макс 30%), только для профессий с доступом (`professionHasInsiderAccess`)
- Шаблоны в `assets/news.ts` (StaticNewsTemplate) с `sentimentScore`, `secondarySectors`
- `fillNewsTemplate()` — подстановка `{company}`, `{ticker}`, `{sector}`
- Инсайдер создаёт `NewsPressure` (scheduled impact через N ходов)

#### Влияние на рынок (`NewsImpactService`)
- `applyNews()` — создаёт `NewsPressure` на тикеры/сектора
- `decayNewsPressures()` — затухание каждый ход

---

### 9. Сохранения / Saves (`backend/src/modules/saves/`)

- 3 слота на пользователя (`slot: 1..3`)
- `SavesService.create()` — стартовый набор: 1 стартовый предмет (в рассрочку), welcome news, инициализация рынка, стартовые офферы недвижимости (грейды F, E)
- `ensureGameBootstrap()` — ленивая инициализация при загрузке

---

### 10. Аутентификация (`backend/src/modules/auth/`)
- JWT (access + refresh tokens в Redis)
- OAuth: Yandex, Google
- Middleware `authenticate` — проверка access token, рефреш при необходимости

---

### 11. Активы / Данные (`backend/src/assets/`)

| Файл | Содержимое |
|------|------------|
| `companies.ts` | 30 компаний: ticker, name, sector |
| `real_estate.ts` | ~25 объектов: id, name, basePrice, monthlyPayment, installmentMonths, special (пассивный доход, etc) |
| `stock_grade.ts` | Конфиг грейдов F–A: minBankingLevel, minReputation, availableOnExchange, priceRange |
| `profession_sector.ts` | Маппинг профессия → сектор инсайда |
| `sector_spillover.ts` | Вторичные сектора для новостей |
| `news.ts` | Шаблоны статических новостей по секторам/видам |
| `npcs.ts` | Список NPC-ботов для сделок |
| `living_expenses.ts` | Шаблоны чеков расходов на жизнь |
| `dreams.ts` | Определения мечт по профессиям (см. выше) |
| `economy_constants.ts` | Константы: SALARY_TURN_INTERVAL=3, BASE_LIVING_EXPENSE и т.д. |

---

## Frontend — Архитектура (`ui/src/`)

### Стейт-менеджмент (Zustand stores)
| Store | Назначение |
|-------|------------|
| `game.store.ts` | Основной игровой стейт: balance, turn, news, portfolio, stocks, deals, propertyOffers, characterProfile, skills, bank, dream, nextTurnForecast + все экшены (endTurn, acceptDeal, buyStock, upgradeSkill, etc) |
| `saves.store.ts` | Список слотов: loadSlots, deleteGame |
| `auth.store.ts` | User, tokens, login/register/oauth |
| `characters.store.ts` | Ростер персонажей для экрана новой игры (с превью мечты) |
| `game_settings.store.ts` | Настройки: dynamicBackground, colorTheme, sidebarCollapsed |

### Страницы
| Страница | Путь | Описание |
|----------|------|----------|
| `SlotsPage` | `/slots` | Выбор сохранения / новая игра / удаление |
| `NewGamePage` | `/new-game?slot=N` | Выбор профессии, превью мечты, стартовые активы |
| `GameDashboardPage` | `/game?id=UUID` | Главный игровой экран (3 колонки) |
| `MenuPage` | `/menu` | Главное меню |
| `AuthPage` | `/auth` | Логин / регистрация / OAuth |
| `SettingsPage` | `/settings` | Настройки игры |
| `RoadmapPage` | `/roadmap` | Дорожная карта |
| `FeedbackPage` | `/feedback` | Обратная связь |

### Game Dashboard — Layout (3 колонки)
```
LeftSidebar (25%)     | CenterPanel (50%)     | RightPanel (25%)
- Character profile   | News feed (tabs)      | Real estate offers
- Work widget         |   - All               | OTC deals
- Salary segments     |   - Stocks            | Deal offers (NPC)
- Next turn forecast  |   - Real estate       | Exchange (stocks)
- Skills preview      |   - Deals             |   - Portfolio
                      | Exchange tab          |   - IPO
                      | Deals tab             |   - Market sentiment
                      | Real estate tab       |   - Sector momentum
```

### Ключевые компоненты
- `DealCard` — аватар бота, колонки «Бот даёт» / «Вы даёте», бейдж выгоды %, счётчик ходов, кнопки Принять/Отклонить
- `PropertyOfferCard` — тип BUY/SELL, грейд прибыльности, цена, кнопка переговоров, первоначальный взнос
- `SkillCard` — уровень, прогресс-бар, стоимость апгрейда, бонусы, модалка подтверждения
- `NewsNewspaperModal` — модальное окно новости с анимацией «газеты»
- `NegotiateModal` — D20 бросок с анимацией костей (react-3d-dice)

### API клиент (`ui/src/lib/http.ts`, `ui/src/api/`)
- `ky`-based HTTP клиент с middleware для auth refresh
- Автогенерированные типы из OpenAPI (`schema.d.ts`)
- Модули: `gameTurn.ts`, `stocks.ts`, `propertyOffers.ts`, `deals.ts`, `otcDeals.ts`, `dreams.ts`, `auth.ts`

---

## Prisma Схема — Ключевые модели

```prisma
model User {
  id            String   @id @default(uuid())
  email         String   @unique
  passwordHash  String
  refreshTokens RefreshToken[]
  games         Game[]
}

model Game {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  slot        Int
  name        String
  step        Int      @default(1)
  status      GameStatus @default(ACTIVE)
  startedAt   DateTime @default(now())
  completedAt DateTime?
  character   Character?
  stocks      Stock[]
  stockListings GameStockListing[]
  news        News[]
  propertyOffers PropertyOffer[]
  dealOffers  DealOffer[]
  otcDeals    OtcDeal[]
  inventoryItems InventoryItem[]
  priceHistory PriceHistory[]
  marketSentiment MarketSentiment?
  sectorMomentum SectorMomentum[]
  dream       Dream?
  @@unique([userId, slot])
}

model Character {
  id                String   @id @default(uuid())
  gameId            String   @unique
  game              Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  name              String
  profession        Profession
  professionLevel   Int      @default(1)
  balance           Float    @default(0)
  salary            Int
  reputation        Float    @default(3)
  tradingLevel      Int      @default(1)
  bankingLevel      Int      @default(1)
  propertySlotLevel Int      @default(1)
  totalSpent        Float    @default(0)
  totalEarned       Float    @default(0)
  totalTrades       Int      @default(0)
  successfulTrades  Int      @default(0)
  tradeSuccessStreak Int     @default(0)
  isNpc             Boolean  @default(false)
  dreamItemRefs     String[]
  inventoryItems    InventoryItem[]
}

model InventoryItem {
  id                  String   @id @default(uuid())
  characterId         String
  character           Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  itemRef             String
  name                String
  purchasePrice       Float
  isInstallment       Boolean  @default(false)
  downPaymentAmount   Float?
  monthlyPayment      Float?
  installmentsTotal   Int?
  installmentsPaid    Int      @default(0)
  installmentPrepay   Float    @default(0)
  isPaidOff           Boolean  @default(false)
  special             String?  // "пассивный доход 500/ход"
  purchasedAt         DateTime @default(now())
}

model GameStockListing {
  id                  String   @id @default(uuid())
  gameId              String
  game                Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  companyId           String
  company             Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  grade               StockGrade
  currentPrice        Float
  previousPrice       Float
  dayChange           Float    @default(0)
  availableOnExchange Boolean
  isLocked            Boolean  @default(false)
  paysDividends       Boolean  @default(false)
  dividendYieldPct    Float?
  turnsUntilDividend  Int?
  dividendGrowthRate  Float?
  @@unique([gameId, companyId])
}

model DealOffer {
  id                  String   @id @default(uuid())
  gameId              String
  game                Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  botCharacterId      String
  purpose             String?
  botGives            Json     // DealBundle
  playerGives         Json     // DealBundle
  requiredReputation  Float
  requiredTradingLevel Int
  reputationPenalty   Float
  playerBenefitValue  Float
  playerBenefitPercent Float
  status              DealOfferStatus @default(ACTIVE)
  turnCreated         Int
  expiresTurn         Int
  @@index([gameId, status, expiresTurn])
}

model PropertyOffer {
  id                     String   @id @default(uuid())
  gameId                 String
  game                   Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  assetId                String
  inventoryItemId        String?
  type                   PropertyOfferType // BUY | SELL
  offerPrice             Float
  marketPrice            Float
  profitPercent          Float
  profitGrade            String   // F..A
  requiredBankingLevel   Int
  isHot                  Boolean  @default(false)
  isActive               Boolean  @default(true)
  pendingNegotiatedPrice Float?
  pendingNegotiatedPercent Float?
  expiresAtTurn          Int
  createdAt              DateTime @default(now())
}

model Dream {
  id           String       @id @default(uuid())
  characterId  String       @unique
  character    Character    @relation(fields: [characterId], references: [id], onDelete: Cascade)
  dreamType    String
  currentStage Int          @default(0)
  stages       DreamStage[]
}

model DreamStage {
  id            String   @id @default(uuid())
  dreamId       String
  dream         Dream    @relation(fields: [dreamId], references: [id], onDelete: Cascade)
  stageIndex    Int
  status        DreamStageStatus @default(LOCKED)
  completedAt   DateTime?
  completedTurn Int?
  @@unique([dreamId, stageIndex])
}

model News {
  id          String   @id @default(uuid())
  gameId      String
  game        Game     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  kind        String
  title       String
  body        String
  sentiment   Sentiment
  impact      Float
  sector      MarketSector?
  companyId   String?
  company     Company? @relation(fields: [companyId], references: [id], onDelete: SetNull)
  expiresAt   DateTime
  payload     Json?
  publishedAt DateTime @default(now())
}
```

---

## Важные нюансы и edge cases

### 1. Деньги и баланс
- Все денежные операции в транзакциях Prisma
- `balance` может уйти в минус → `game.status = 'COMPLETED'` (банкротство)
- `totalSpent` / `totalEarned` — для статистики

### 2. Рассрочки и ипотека
- `isInstallment + !isPaidOff` = активный долг
- `hasActiveInstallmentDebt()` проверяет: `installmentsPaid < installmentsTotal` И `monthlyPayment > 0`
- При продаже с долгом: `calcInstallmentSaleBreakdown()` — считает остаток долга, вычитает из цены продажи
- Досрочное погашение: `applyEarlyInstallmentPayment()` — увеличивает `installmentsPaid`, может установить `isPaidOff = true`

### 3. Репутация
- Диапазон: 1–10 (clamp)
- Успешная сделка: +0.2 (если benefit ≥ 0) или -penalty
- Провал переговоров: -0.1, сброс streak
- Успешная торговля недвижимостью: `calcReputationAfterSuccessfulTrade()` — бонус за streak

### 4. Блокировки контента
- Акции: `bankingLevel < minBankingLevel` ИЛИ `reputation < minReputation` ИЛИ `!availableOnExchange` → `isLocked`
- Недвижимость: `bankingLevel < requiredBankingLevel` → `isLocked` в UI
- Слоты недвижимости: `propertySlotLevel` определяет макс. активных предметов

### 5. Инсайдерские новости
- Только для профессий с `professionHasInsiderAccess()`
- Создают `NewsPressure` с `triggerAtStep = currentStep + turnsUntilImpact`
- Наступают автоматически в `MarketTurnPhase` через `NewsImpactService`

### 6. Цикл контента хода
Строгая последовательность: `stock` → `deal` → `property` (каждый 3-й ход)
Реализовано в `news_cycle.ts:pickNextContentType()` — смотрит на `lastKind` из БД

### 7. Фронтенд: синхронизация после endTurn
- `game.store.ts:endTurn()` — сложная логика merge'а новостей (`merge_news_items`, `remap_news_for_step`)
- Fallback: если endTurn упал → пробует `fetchGameDashboard()` для полной пересинхронизации
- `endingTurnInFlight` — защита от двойного клика

---

## API Endpoints (Backend)

### Auth
- `POST /auth/register` — регистрация
- `POST /auth/login` — логин
- `POST /auth/refresh` — рефреш токенов
- `GET /auth/yandex`, `GET /auth/google` — OAuth
- `POST /auth/logout`

### Characters
- `GET /characters` — ростер для новой игры

### Saves
- `GET /saves` — список слотов
- `POST /saves` — создать игру (body: `{ name?, slot, profession }`)
- `GET /saves/:id` — загрузить игру
- `PATCH /saves/:id` — обновить (name, status)
- `DELETE /saves/:id` — удалить

### Game
- `POST /saves/:id/end-turn` — закончить ход (body: `{ expectedStep }`)
- `GET /saves/:id/dashboard` — полный снапшот для дашборда
- `GET /saves/:id/news` — лента новостей
- `GET /saves/:id/next-turn-forecast` — прогноз денежного потока
- `POST /saves/:id/skills/:skillId/upgrade` — апгрейд навыка
- `POST /saves/:id/property-offers/:offerId/accept` — купить/продать недвижимость
- `POST /saves/:id/property-offers/:offerId/negotiate` — торговаться
- `POST /saves/:id/property-offers/:offerId/negotiate/accept` — принять переговоры
- `POST /saves/:id/property-offers/:offerId/negotiate/decline` — отклонить переговоры
- `POST /saves/:id/otc-deals/accept` — принять OTC сделку
- `POST /saves/:id/deals/accept` — принять NPC сделку
- `POST /saves/:id/inventory/:itemId/pay-off-installment` — досрочное погашение
- `GET /saves/:id/dream` — получить мечту
- `POST /saves/:id/dream/complete-stage` — завершить этап мечты
- `POST /saves/:id/dream/fulfill` — исполнить мечту (завершить игру)

### Market (Stocks)
- `GET /saves/:id/stocks` — листинг биржи
- `GET /saves/:id/stocks/:listingId` — детальная страница + история
- `POST /saves/:id/stocks/:listingId/buy` — купить акции
- `POST /saves/:id/stocks/:listingId/sell` — продать акции
- `GET /saves/:id/stocks/:listingId/history` — история цен
- `GET /saves/:id/market-sentiment` — настроение рынка
- `GET /saves/:id/sector-momentum` — секторный моментум
- `POST /saves/:id/ipos/:ipoId/subscribe` — подписаться на IPO

---

## Запуск и разработка

```bash
# Установка
npm install

# Генерация OpenAPI типов
npm run openapi

# Backend dev
cd backend && npm run dev

# Frontend dev
cd ui && npm run dev

# Тесты backend
cd backend && npm test

# Линт/тайпчек (если настроены)
npm run lint
npm run typecheck
```

### Docker
```bash
docker-compose -f backend/docker-compose.yml up -d  # postgres + redis
```

---

## Файлы конфигурации
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, OAuth credentials
- `backend/prisma/schema.prisma` — схема БД
- `ui/vite.config.ts` — Vite + React + Tailwind
- `ui/tailwind.config.ts` — (если есть) или CSS-first в `style.css`
- `package.json` (root) — workspaces: `scripts: `openapi:export`, `codegen`, `openapi`

---

## Чек-лист для ревью / рефакторинга

### Backend
- [ ] `DealGenerator` — magic numbers (weights, ranges) → константы/конфиг
- [ ] `PropertyOffersService` — дублирование логики accept/negotiate → вынести в приватные методы
- [ ] `NewsGenerationService` — большой класс, разделить на стратегии по `kind`
- [ ] `GameService` — 600+ строк, вынести `accept*` методы в отдельные хендлеры/сервисы
- [ ] Транзакции: везде используются `$transaction`, проверить изоляцию (serializable?)
- [ ] Индексы БД: `DealOffer(gameId, status, expiresTurn)`, `PropertyOffer(gameId, isActive, expiresAtTurn)`

### Frontend
- [ ] `game.store.ts` — 1000+ строк, разделить на слайсы (news, portfolio, character, etc)
- [ ] Мемоизация: `useMemo` для `dashboardUi`, проверять лишние ре-рендеры
- [ ] Error boundaries для критических секций (биржа, сделки)
- [ ] Доступность (a11y): модалки, фокус, ARIA

### Общее
- [ ] OpenAPI схема — проверить актуальность (`npm run openapi:export`)
- [ ] Миграции Prisma — именование, rollback стратегия
- [ ] Логирование: `logger.ts` используется? Уровни, структурированные логи