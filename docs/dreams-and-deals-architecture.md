# Dream & Deal Architecture

## 1. Сделки (Deal Offers)

### 1.1 Purpose

bundle-to-bundle обмен активами между игроком и случайным NPC-ботом раз в ~3 хода.
Каждая сторона может содержать любую комбинацию `CASH | STOCK | PROPERTY`.
Цель — дать игроку возможность получить выгоду за счёт переговоров с ботами.

### 1.2 Directory Structure

```
backend/src/modules/deals/
  deal.service.ts        — принятие/отклонение сделок, валидация, транзакции
  deal.generator.ts      — генерация предложений (шаблоны, расчёт выгоды)
  deal.types.ts          — типы DealAsset, DealBundle, GeneratedDealOffer и т.д.

backend/src/schemas/
  deal.schema.ts         — Zod-схемы (dealOfferSchema, acceptDealBodySchema и т.д.)

backend/prisma/models/
  deal_offer.prisma      — Prisma-модель DealOffer

backend/src/modules/game/
  _phases/_turn_content.phase.ts  — вызов генерации сделки в пайплайне
  _phases/index.ts                — порядок фаз (шаг 5 = TurnContentPhase)
  _service.ts                     — #listActiveDeals(), acceptDeal(), rejectDeal()

ui/src/pages/game_dashboard/_components/deals/
  index.tsx              — DealsPanel
  _deal_card.tsx         — DealCard (отображение и кнопки)

ui/src/stores/
  game.store.ts          — экшены acceptDeal, rejectDeal, состояние deals[]

ui/src/api/
  deals.ts               — acceptDeal / rejectDeal API вызовы
  gameTurn.ts            — типы DealOfferPayload, DealAsset, DealBundle
```

### 1.3 Data Flow

```
[Фаза TurnContentPhase]
    │ contentType === 'deal'
    ├─ #generateDealOffer(context)
    │   ├─ выбор случайного NPC (isNpc: true)
    │   ├─ DealGenerator.maybeGenerate(...) → шаблон по весам
    │   ├─ расчёт requiredReputation, expiresInTurns
    │   └─ INSERT в deal_offers (status: 'ACTIVE')
    └─ сохранение в EndTurnResult.dealOffers

[Frontend получает dealOffers]
    └─ set(state.deals = dealOffers)

[Пользователь нажимает «Принять»]
    └─ store.acceptDeal(dealId)
        └─ POST /saves/:id/deals/accept { dealId }
            └─ GameService.acceptDeal()
                └─ DealService.accept()
                    ├─ проверка статуса и срока
                    ├─ проверка репутации
                    ├─ validatePlayerCanGive(character, playerGives)
                    │   ├─ CASH: balance >= cashAmount
                    │   ├─ STOCK: тикер и shares в портфеле
                    │   └─ PROPERTY: in inventory && !isInstallment || isPaidOff
                    ├─ транзакция:
                    │   ├─ executeGive (списание)
                    │   ├─ executeReceive (зачисление)
                    │   └─ обновление reputation, totalTrades, successfulTrades
                    ├─ статус deal → 'ACCEPTED'
                    └─ создание новости о сделке

[Пользователь нажимает «Отклонить»]
    └─ store.rejectDeal(dealId)
        └─ POST /saves/:id/deals/reject { dealId }
            └─ GameService.rejectDeal()
                └─ DealService.reject()
                    └─ статус deal → 'REJECTED'

[Синхронизация при загрузке дашборда / endTurn]
    └─ getDashboard() / endTurn()
        └─ #listActiveDeals() — SELECT WHERE status='ACTIVE' AND expiresTurn >= step
```

### 1.4 Key Types

```typescript
// backend/src/modules/deals/deal.types.ts
type DealAssetType = 'CASH' | 'STOCK' | 'PROPERTY';
interface DealAsset {
  type: DealAssetType;
  cashAmount?: number;
  stockListingId?: string;
  ticker?: string; companyName?: string;
  shares?: number;
  propertyId?: string; propertyName?: string;
  estimatedValue: number;
}
interface DealBundle { assets: DealAsset[]; totalEstimatedValue: number; }
type DealOfferStatus = 'ACTIVE' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'NEGOTIATED';

interface GeneratedDealOffer {
  id: string; botCharacterId: string; botName: string; botProfession: string;
  botGives: DealBundle; playerGives: DealBundle;
  requiredReputation: number; reputationPenalty: number;
  playerBenefitValue: number; playerBenefitPercent: number;
  status: DealOfferStatus; turnCreated: number; expiresTurn: number;
  expiresInTurns: number; botAvatarSrc?: string;
}

// backend/src/modules/deals/deal.generator.ts
type DealTemplate = 'CASH_FOR_STOCK' | 'PROPERTY_FOR_CASH' | 'MIXED_BUNDLE';
// Template weights: CASH_FOR_STOCK=3, PROPERTY_FOR_CASH=2, MIXED_BUNDLE=2
```

### 1.5 Prisma Model

```prisma
model DealOffer {
  id             String @id @default(uuid())
  gameId         String
  game           Game   @relation(fields: [gameId], references: [id], onDelete: Cascade)
  botCharacterId String
  botGives       Json
  playerGives    Json
  requiredReputation   Float  @default(0)
  reputationPenalty    Float  @default(1.0)
  playerBenefitValue   Float  @default(0)
  playerBenefitPercent Float  @default(0)
  status       String @default("ACTIVE")
  turnCreated  Int    @default(1)
  expiresTurn  Int
  createdAt    DateTime @default(now())
  @@index([gameId, status])
  @@map("deal_offers")
}
```

### 1.6 API Routes

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| POST | `/saves/:id/deals/accept` | `{ dealId: uuid }` | `{ balance, previousBalance, character, news }` |
| POST | `/saves/:id/deals/reject` | `{ dealId: uuid }` | `{ success: boolean }` |

### 1.7 NPC Selection

```typescript
// _turn_content.phase.ts:136-199
// 1. Ищем NPC: prisma.character.findMany({ where: { isNpc: true } })
// 2. Если нет — #seedNpcs() создаёт из NPCS (6 персонажей: дворник, фермер, инженер, разработчик, финансист, врач)
// 3. Исключаем игрока (character.id)
// 4. Случайный выбор: availableNpcs[Math.floor(Math.random() * availableNpcs.length)]
```

### 1.8 Frontend Components

**DealsPanel** (`_components/deals/index.tsx`):
- Читает `deals`, `acceptDeal`, `rejectDeal` из `useGameStore`
- Заголовок «Сделки» + счётчик активных
- Маппит `deals` в `DealCard[]` или пустое состояние

**DealCard** (`_components/deals/_deal_card.tsx`):
- Аватар бота + имя + профессия
- Бейдж выгоды (зелёный/красный процент)
- Счётчик оставшихся ходов (жёлтый border на последнем ходу)
- Две колонки: «Бот даёт» / «Вы даёте» — строки активов:
  - `CASH` → `{amount} ден.`
  - `STOCK` → `{shares} × {ticker}`
  - `PROPERTY` → `AssetImageFrame` + название + стоимость
- Footer: requiredReputation, totalBenefitValue, кнопки «Отклонить» / «Принять»

**Store** (`game.store.ts`):
- `state.deals: DealOfferPayload[]` (инициализация `[]`)
- `acceptDeal(dealId)`: вызов API → обновление баланса → удаление из списка → добавление новости
- `rejectDeal(dealId)`: вызов API → удаление из списка
- Заполняется из `EndTurnResponse.dealOffers` и `GameDashboardResponse.dealOffers`

### 1.9 Edge Cases / Validation

| Ситуация | Обработка |
|----------|-----------|
| Сделка просрочена (`expiresTurn < currentStep`) | `DEAL_EXPIRED` (404), статус → `'EXPIRED'` |
| Сделка уже принята/отклонена | `DEAL_NOT_ACTIVE` (400) |
| Репутация ниже requiredReputation | `REPUTATION_TOO_LOW` (400) |
| Не хватает денег / акций / имущества | `INSUFFICIENT_...` (400) |
| Недвижимость в рассрочке (isInstallment && !isPaidOff) | Ошибка, нельзя передать |
| Делоффер невалидного UUID | Валидация Zod (uuid) |
| DealOffer не существует (404) | `DEAL_NOT_FOUND` |

---

## 2. Мечта (Dream)

### 2.1 Purpose

Долгосрочная цель персонажа из 5 этапов, привязанная к профессии.
Игрок поэтапно выполняет требования (деньги, портфель, пассивный доход, репутация, навыки, имущество).
Исполнение финального (5-го) этапа завершает игру (`game.status = 'COMPLETED'`).
Никакой откат этапов — статус `COMPLETED` хранится явно в БД.

### 2.2 Directory Structure

```
backend/src/assets/
  dreams.ts                  — определения мечт и этапов для всех 6 профессий

backend/src/modules/dreams/
  dream.service.ts           — getDream, completeStage, fulfillDream, createDream

backend/src/schemas/
  dream.schema.ts            — Zod-схемы (DreamStageRequirement, DreamResponse, CompleteStageBody)

backend/prisma/models/
  dream.prisma               — Prisma-модели Dream + DreamStage

backend/src/modules/game/
  routes.ts                  — dream API-маршруты (GET dream, POST complete-stage, POST fulfill)
```

### 2.3 Определения (dreams.ts)

```typescript
// backend/src/assets/dreams.ts
type DreamStageRequirement = {
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
};

// 6 профессий × 5 этапов:
// STREET_CLEANER → OWN_BUSINESS
//   Этап 1: balance 10k, profLvl 2
//   Этап 2: balance 15k, passive 400, владеть warehouse (fully)
//   Этап 3: portfolio 50k, rep 5, tradingLvl 2
//   Этап 4: balance 50k, владеть apartment (fully), car
//   Этап 5: balance 100k, portfolio 150k, rep 7, владеть penthouse (fully), sport_car (fully)

// FARMER → FINANCIAL_FREEDOM
//   Этап 1: balance 8k, profLvl 1
//   Этап 5: passive 3000, portfolio 200k, rep 8

// ENGINEER → DREAM_HOUSE
//   Этап 1: balance 12k
//   Этап 5: владеть house (fully), land_plot, portfolio 100k

// DEVELOPER → INVESTMENT_EMPIRE
//   Этап 1: balance 15k, tradingLvl 2
//   Этап 5: portfolio 300k, 3+ properties, rep 9

// FINANCIER → PREMIUM_ASSET
//   Этап 1: balance 20k, bankingLvl 2
//   Этап 5: владеть penthouse (fully), sport_car (fully), yacht (fully), portfolio 500k

// DOCTOR → FAMILY_CAPITAL
//   Этап 1: balance 10k
//   Этап 5: portfolio 250k, владеть house (fully), apartment (fully), rep 8
```

### 2.4 Data Flow

```
[Создание игры (SavesService.create)]
    ⚠ Dream НЕ создаётся при старте игры (TODO)
    └─ Dream создаётся только при первом вызове getDream() (#createDream)

[GET /saves/:id/dream]
    └─ DreamService.getDreamForGame(userId, saveId)
        ├─ поиск Game + Character + Inventory
        └─ getDream(character, currentStep)
            ├─ #createDream — если нет Dream в БД: создаёт с 1-м этапом ACTIVE, остальные LOCKED
            ├─ расчёт portfolioValue (∑ qty × purchasePrice всех акций)
            ├─ расчёт passiveIncome (парсинг 'пассивный доход NNN' из special-полей инвентаря)
            └─ маппинг этапов со статусами:
                COMPLETED        — DB запись COMPLETED или stageIndex < currentStage
                ACTIVE           — stageIndex === currentStage && требования НЕ выполнены
                READY_TO_COMPLETE — stageIndex === currentStage && требования выполнены
                LOCKED           — stageIndex > currentStage

[POST /saves/:id/dream/complete-stage { dreamId }]
    └─ DreamService.completeStageForGame(userId, saveId, dreamId)
        └─ completeStage(characterId, dreamId)
            ├─ валидация: Dream существует, не последний этап
            ├─ #checkRequirements — все числовые проверки + инвентарь
            └─ INSERT/UPDATE DreamStage (status: COMPLETED), currentStage += 1

[POST /saves/:id/dream/fulfill { dreamId }]
    └─ DreamService.fulfillDreamForGame(userId, saveId, dreamId)
        └─ fulfillDream(characterId, gameId, dreamId)
            ├─ валидация: Dream существует, currentStage >= lastStageIndex
            ├─ #checkRequirements для последнего этапа
            └─ Game.update({ status: 'COMPLETED', completedAt: new Date() })
```

### 2.5 Key Types (Zod)

```typescript
// backend/src/schemas/dream.schema.ts
type DreamStageStatus = 'LOCKED' | 'ACTIVE' | 'READY_TO_COMPLETE' | 'COMPLETED';

interface DreamStageRequirement { ... }  // как в dreams.ts

interface DreamStageResponse {
  stageIndex: number;
  status: DreamStageStatus;
  requirement: DreamStageRequirement;
  completedAt: string | null;
}

interface DreamResponse {
  id: string;
  dreamType: string;
  title: string;
  description: string;
  currentStage: number;
  stages: DreamStageResponse[];
  isFulfilled: boolean;
}
```

### 2.6 Prisma Models

```prisma
model Dream {
  id          String  @id @default(uuid())
  characterId String  @unique
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  dreamType   String
  currentStage Int     @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  stages     DreamStage[]
  @@map("dreams")
}

model DreamStage {
  id        String  @id @default(uuid())
  dreamId   String
  dream     Dream   @relation(fields: [dreamId], references: [id], onDelete: Cascade)
  stageIndex Int
  status    String  @default("LOCKED")
  completedAt DateTime?
  @@unique([dreamId, stageIndex])
  @@map("dream_stages")
}
```

### 2.7 API Routes

| Метод | Путь | Тело | Ответ |
|-------|------|------|-------|
| GET | `/saves/:id/dream` | — | `DreamResponse` |
| POST | `/saves/:id/dream/complete-stage` | `{ dreamId }` | `DreamResponse` |
| POST | `/saves/:id/dream/fulfill` | `{ dreamId }` | `{ success: true }` |

Handlers (`routes.ts:360-440`):
```typescript
GET  /saves/:id/dream               → dreamService.getDreamForGame(userId, id)
POST /saves/:id/dream/complete-stage → dreamService.completeStageForGame(userId, id, dreamId)
POST /saves/:id/dream/fulfill        → dreamService.fulfillDreamForGame(userId, id, dreamId) → { success: true }
```

### 2.8 DreamService Key Methods

| Метод | Видимость | Параметры | Описание |
|-------|-----------|-----------|----------|
| `getDream` | public | `character, currentStep` | Вычисляет/создаёт Dream, возвращает этапы с вычисленными статусами |
| `completeStage` | public | `characterId, dreamId` | Валидирует и завершает текущий этап (не последний) |
| `fulfillDream` | public | `characterId, gameId, dreamId` | Валидирует и завершает всю игру |
| `#createDream` | private | `character` | Создаёт Dream в БД из PROFESSION_DREAMS |
| `#checkRequirements` | private | `req, character, portfolioValue, passiveIncome, hasActiveInstallments` | Проверяет все условия этапа |
| `#calculatePortfolioValue` | private | `inventory` | Сумма qty × purchasePrice |
| `#calculatePassiveIncome` | private | `inventory` | Парсинг 'пассивный доход NNN' из special |
| `getDreamForGame` | public | `userId, saveId` | Wrapper для getDream |
| `completeStageForGame` | public | `userId, saveId, dreamId` | Wrapper для completeStage |
| `fulfillDreamForGame` | public | `userId, saveId, dreamId` | Wrapper для fulfillDream |

### 2.9 Validation (checkRequirements)

```typescript
// dream.service.ts:183-215
// Проверяет:
//   character.balance >= req.minBalance
//   portfolioValue    >= req.minPortfolioValue
//   passiveIncome     >= req.minPassiveIncome
//   character.reputation >= req.minReputation
//   character.professionLevel >= req.minProfessionLevel
//   character.tradingLevel    >= req.minTradingLevel
//   character.bankingLevel    >= req.minBankingLevel
//   Каждый requiredItems — есть в character.inventoryItems (itemRef)
//   Каждый requireItemFullyOwned — есть + (!isInstallment || isPaidOff)
//   noActiveInstallments — нет предметов с isInstallment && !isPaidOff
```

### 2.10 Edge Cases / Validation

| Ситуация | Обработка |
|----------|-----------|
| Dream не существует | Авто-создание при первом getDream |
| Повторный completeStage (уже COMPLETED) | `STAGE_ALREADY_COMPLETED` |
| Попытка completeStage для финального этапа | `MUST_USE_FULFILL` — используйте fulfillDream |
| Требования не выполнены | `STAGE_REQUIREMENTS_NOT_MET` |
| Dream чужого персонажа | `DREAM_NOT_FOUND` (characterId mismatch) |
| Профессия без определения | `DREAM_DEFINITION_NOT_FOUND` |
| Завершение игры (fulfill) — не все этапы пройдены | `DREAM_NOT_READY` |

### 2.11 Frontend Status

**Не реализовано.** Backend API готов (GET + 2 POST), но frontend-компонентов нет:
- Нет DreamScreen / DreamPanel
- Нет store-экшенов (fetchDream, completeStage, fulfillDream)
- Нет навигационной вкладки для мечты
- В профиле персонажа отображается только старый список желаемых предметов (`dreamItemRefs`)

### 2.12 Known Issues / TODOs

1. **Dream не создаётся при старте игры** — `SavesService.create()` не вызывает `DreamService.createDream()`. Сейчас Dream создаётся лениво при первом `GET /dream`.
2. **Frontend отсутствует** — нужен DreamScreen с отображением этапов, progress bar, кнопками «Завершить этап» / «Исполнить мечту».
3. **Последний этап**: кнопка должна быть «Исполнить мечту» (не «Завершить этап»), она проверяет текущее состояние на момент клика (не сохраняет REQUIREMENTS_MET заранее).

---

## 3. Cross-cutting: Game Pipeline

```
Phases order (index.ts):
  1. EconomyPhase           — экономические события
  2. AdvanceStepPhase       — увеличение step
  3. MarketTurnPhase         — обработка рынка + IPO (IPO сейчас без новостей)
  4. PropertyOffersExpiryPhase — протухание офферов недвижимости
  5. TurnContentPhase        — генерация контента хода (stock | deal | property)
```

Deal-offer news создаются сразу после генерации сделки внутри `TurnContentPhase`.
Dream не участвует в пайплайне — это ручной запрос с фронта.

---

## 4. Summary of Key File Mappings

| Концепт | Backend | Frontend | Prisma |
|---------|---------|----------|--------|
| Deal generation | `deals/deal.generator.ts` | — | — |
| Deal service | `deals/deal.service.ts` | `stores/game.store.ts` | `deal_offer.prisma` |
| Deal API | `game/routes.ts` (POST accept/reject) | `api/deals.ts` | — |
| Deal display | — | `_components/deals/*` | — |
| Dream definitions | `assets/dreams.ts` | — | — |
| Dream service | `dreams/dream.service.ts` | — | `dream.prisma` |
| Dream API | `game/routes.ts` (GET + 2 POST) | — | — |
| Dream display | — | ⚠ не реализован | — |
