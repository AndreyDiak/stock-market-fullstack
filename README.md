# Stock Market — игровая механика

## Сделки (Deal Offers)

bundle-to-bundle обмен активами между игроком и случайным NPC-ботом раз в 3 хода.

### Цикл генерации

В `_turn_content.phase.ts` (шаг 5 пайплайна) выбирается тип контента: `stock | deal | property`. При `deal` вызывается `#generateDealOffer()`:

1. Выбор случайного NPC из БД (`isNpc: true`, без `gameId`). Если NPC нет — авто-сид из `NPCS`.
2. `DealGenerator.maybeGenerate()` выбирает шаблон по весам:
   - **Cash-for-stock** (вес 3): 5–30 акций случайной компании
   - **Property-for-cash** (вес 2): обмен недвижимости на деньги
   - **Mixed bundle** (вес 2): акции (3–15) + кэш (2000–15000) + опциональная недвижимость
3. `requiredReputation` = `clamp(player.reputation × 0.7, 1, 10)`
4. `expiresInTurns` = 2–4
5. Сделка сохраняется в `deal_offers` со статусом `ACTIVE`

### Принятие сделки

В `deal.service.ts:accept()`:
1. Проверка `status === 'ACTIVE'` и `expiresTurn >= gameStep`
2. Проверка `character.reputation >= requiredReputation`
3. `#validatePlayerCanGive(character, playerGives)`:
   - `CASH`: баланс ≥ cashAmount
   - `STOCK`: тикер и количество в портфеле
   - `PROPERTY`: предмет в инвентаре, `!isInstallment || isPaidOff`
4. Транзакция: `#executeGive` (списание) + `#executeReceive` (зачисление) + обновление репутации/статистики
5. Статус → `ACCEPTED`, создаётся новость о сделке

### Отклонение

Статус → `REJECTED`.

### Активные сделки

`#listActiveDeals()` выборка из БД: `status === 'ACTIVE' && expiresTurn >= currentStep`.
Возвращаются в `EndTurnResult.dealOffers` и `getDashboard()`.

### Хранение

**Prisma** (`deal_offer.prisma`): `DealOffer` с полями `botGives`/`playerGives` (JSON), `requiredReputation`, `reputationPenalty`, `playerBenefitPercent`, `status`, `turnCreated`, `expiresTurn`.

### Frontend

- **Вкладка «Сделки»** — `DealsPanel` → `DealCard[]`
- **DealCard**: аватар бота, колонки «Бот даёт» / «Вы даёте», бейдж выгоды (% зелёный/красный), счётчик ходов, кнопки «Принять» / «Отклонить»
- **Store**: `deals: DealOfferPayload[]`, экшены `acceptDeal(dealId)` / `rejectDeal(dealId)`

---

## Мечта (Dream)

Долгосрочная цель персонажа (5 этапов), привязанная к профессии. Исполнение финального этапа завершает игру.

### Определения

`backend/src/assets/dreams.ts` — 6 профессий × 5 этапов:

| Профессия | Мечта | Этапы |
|-----------|-------|-------|
| `STREET_CLEANER` | Свой бизнес | 1: balance 10k, profLvl 2 → 2: balance 15k, passive 400, склад → 3: portfolio 50k, rep 5, tradeLvl 2 → 4: balance 50k, квартира, машина → 5: balance 100k, portfolio 150k, rep 7, пентхаус, спорткар |
| `FARMER` | Финансовая свобода | 1: balance 8k, profLvl 1 → ... → 5: passive 3000, portfolio 200k, rep 8 |
| `ENGINEER` | Дом мечты | 1: balance 12k → ... → 5: дом, участок, portfolio 100k |
| `DEVELOPER` | Инвестиционная империя | 1: balance 15k, tradeLvl 2 → ... → 5: portfolio 300k, 3+ свойства, rep 9 |
| `FINANCIER` | Премиальный актив | 1: balance 20k, bankLvl 2 → ... → 5: пентхаус, спорткар, яхта, portfolio 500k |
| `DOCTOR` | Семейный капитал | 1: balance 10k → ... → 5: portfolio 250k, дом, квартира, rep 8 |

### Требования этапов

`DreamStageRequirement`:
- `minBalance`, `minPortfolioValue`, `minPassiveIncome`, `minReputation`
- `minProfessionLevel`, `minTradingLevel`, `minBankingLevel`
- `requiredItems`, `requireItemFullyOwned` — ссылки на `REAL_ESTATE`
- `noActiveInstallments` — запрет рассрочек

### Логика (DreamService)

**getDream(character, currentStep)**:
1. Находит/создаёт Dream в БД через `#createDream`
2. Вычисляет `portfolioValue` (∑ qty × purchasePrice) и `passiveIncome` (парсинг `special` поля инвентаря)
3. Для каждого этапа вычисляет статус: `COMPLETED` (DB || index < currentStage), `LOCKED` (index > currentStage), `READY_TO_COMPLETE` (требования выполнены), `ACTIVE` (текущий)

**completeStage(characterId, dreamId)**:
1. Валидация: не последний этап (иначе `fulfillDream`)
2. `#checkRequirements` — числовые проверки + инвентарь
3. Создаёт `DreamStage` со статусом `COMPLETED`, `currentStage++`

**fulfillDream(characterId, gameId, dreamId)**:
1. Проверка: `currentStage >= lastStageIndex` (все предыдущие завершены)
2. Проверка требований финального этапа
3. Устанавливает `game.status = 'COMPLETED'`, `completedAt = now()`

### API

| Маршрут | Метод | Ответ |
|---------|-------|-------|
| `/saves/:id/dream` | GET | `DreamResponse` |
| `/saves/:id/dream/complete-stage` | POST | `DreamResponse` |
| `/saves/:id/dream/fulfill` | POST | `{ success: true }` |

### Frontend

Не реализован (нет DreamScreen, store-экшенов для dream). Мечта пока отображается только как список желаемых предметов (`dreamItemRefs`) в профиле персонажа.
