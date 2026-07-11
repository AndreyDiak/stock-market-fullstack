# Архитектура генерации цен на акции

## Общая схема

```
NewsGenerationService ──> NewsImpactService ──> news_pressures + sentiment + sector_momentum
                                                         │
                                                         ▼
                    MarketService.processTurn() ──> market_engine.calculateNextPrice()
                                                         │
                                                         ▼
                                              game_stock_listings (currentPrice)
                                              price_history (история по ходам)
```

Каждый игровой ход запускает пайплайн из 5 фаз (`game/_phases/`). Фаза `MarketTurnPhase` (`_market_turn.phase.ts`) вызывает `MarketService.processTurn()`, которая обновляет все цены.

---

## 1. Компании (assets/companies.ts)

- **40 вымышленных компаний** в 5 секторах: `TECHNOLOGY` (8), `HEALTHCARE` (6), `FINANCE` (6), `AGRICULTURE` (6), `ENERGY` (7 + 1 TECH)
- Каждая компания имеет: `ticker`, `name`, `sector`, `description`
- При инициализации игры все 40 компаний создаются/находятся в БД через `ensureCompanyByTicker()` (`company_catalog.ts`)

---

## 2. Грейды акций (assets/stock_grade.ts)

6 грейдов с характеристиками:

| Грейд | Волатильность | News Reactivity | Цена | Биржа | Banking | Reputation | Random Noise |
|-------|--------------|-----------------|------|-------|---------|------------|-------------|
| F | 5–25% | 2.5 | 1–30 | Да | 1 | 0 | 1.2 |
| E | 4–18% | 2.0 | 20–150 | Да | 2 | 0 | 1.0 |
| D | 3–12% | 1.5 | 100–600 | Да | 3 | 0 | 0.85 |
| C | 2–8% | 1.0 | 400–2000 | Да | 5 | 1 | 0.7 |
| B | 1–5% | 0.7 | 1500–8000 | **Нет** | 7 | 3 | 0.5 |
| A | 0.5–3% | 0.4 | 5000–50000 | **Нет** | 9 | 5 | 0.35 |

- Начальное распределение: 55% F, 23% E, 14% D, 6% C, 2% B (A не выпадает при инициализации)
- Грейды B и A **недоступны на бирже** — попасть в них можно только через IPO
- `availableOnExchange`, `minBankingLevel`, `minReputation` контролируют доступ игрока

---

## 3. Движок расчета цен (market_engine.ts)

### `calculateNextPrice(listing, forces, rng)`

Формула изменения цены за ход:

```
deltaPercent = randomDelta + newsDelta + sectorDelta + sentimentDelta
```

Где:
- **`randomDelta`** = `(rng() * 2 - 1) * volRange * randomNoise`
  - `volRange = volMin + rng() * (volMax - volMin)` — случайная волатильность в пределах грейда
  - `volRange` умножается на `volatilityBoost` (см. ниже)
  - `randomNoise` — из конфига грейда (1.2 для F, 0.35 для A)
- **`newsDelta`** = `newsPressureTotal * newsReactivity`
  - Суммарное давление новостей × коэффициент реактивности грейда
- **`sectorDelta`** = `sectorMomentum * 2`
- **`sentimentDelta`** = `marketSentiment * 1.5`

Затем `deltaPercent` клиппируется в пределах `[-maxMove, +maxMove]`, где `maxMove = volMax * 1.2 * volatilityBoost`.

Новая цена: `previousPrice * (1 + deltaPercent / 100)`, минимум 0.01.

### `calculateVolatilityBoost(input)`

Множитель волатильности, который усиливает движения при активном рынке:

```
boost = 1
      + min(0.5,  |newsPressureTotal| * 0.35)
      + min(0.25, |sectorMomentum| * 0.2)      [если duration > 0]
      + min(0.15, |marketSentiment| * 0.1)
```

### `decayNewsPressureImpact(impact, decayRate)`

Линейный распад: `impact * (1 - decayRate)`. Если после распада `|impact| < 0.05`, запись удаляется.

### `sumNewsPressures(pressures)`

Суммирует `impact` всех активных `NewsPressure` для одного листинга.

---

## 4. Рыночная сентябрьская динамика

### Market Sentiment (`market_sentiment.engine.ts`)

- Диапазон: **[-1, +1]**
- Каждый ход дрейфует к нулю со скоростью **0.05**
- Индикаторы: `bearish` (≤ -0.35), `neutral`, `bullish` (≥ 0.35)
- Изменяется под воздействием новостей уровня MARKET/RUMOR

### Sector Momentum (`sector_momentum.engine.ts`)

- Диапазон: **[-1, +1]** для каждого из 5 секторов
- Имеет `duration` (счётчик ходов действия) и `trend` (`rising`/`falling`/`neutral`)
- Если `duration > 0`: не затухает, только уменьшается duration
- Если `duration == 0`: дрейфует к нулю со скоростью **0.08**
- Тренд: `rising` при ≥ 0.25, `falling` при ≤ -0.25

---

## 5. Влияние новостей (news_impact.service.ts)

Новости делятся на 4 типа:
- **`MARKET`** — влияет на сектора (основной + spillover) и создаёт `NewsPressure` для всех листингов сектора
- **`RUMOR`** — как MARKET, но с коэффициентом 0.6
- **`COMPANY`** — создаёт `NewsPressure` только для одной компании
- **`INSIDER`** — создаёт `ScheduledPriceImpact` (отложенный удар) + `NewsPressure` через `createInsiderPressure()`

Spillover между секторами (`sector_spillover.ts`):
```
ENERGY ──0.45──> FINANCE, ──0.30──> AGRICULTURE
FINANCE ──0.35──> TECHNOLOGY, ──0.25──> ENERGY
TECHNOLOGY ──0.30──> FINANCE
HEALTHCARE ──0.25──> AGRICULTURE
AGRICULTURE ──0.20──> ENERGY, ──0.15──> HEALTHCARE
```

### Объект NewsPressure

Создаётся в таблице `news_pressures`:
- `impact` — числовая сила влияния на цену (может быть отрицательной)
- `remainingTurns` — сколько ходов ещё действует (обычно 2)
- `decayRate` — скорость затухания (0.2 для обычных, 0.15 для инсайдерских)

---

## 6. Предгенерация истории (sparkline_seed.ts)

Перед стартом игры генерируется **14 точек** предыстории цен (с отрицательными номерами ходов: -13, -12, ..., 0).

Алгоритм:
1. Seeded RNG на основе `${gameId}:${listingId}:${ticker}`
2. Стартовая цена = `currentPrice * 0.86–0.93` (зависит от грейда)
3. Линейный тренд от стартовой к текущей цене + случайное отклонение (`volatility * 2`)
4. Последняя точка принудительно равна `currentPrice` на ходу 0

Коэффициент волатильности для seed: F=1.45, E=1.2, A=0.75, остальные=1.0

---

## 7. Дивиденды (dividend.service.ts)

- **Цикл: 10 ходов**. Если у акции `paysDividends = true`, каждые 10 ходов выплачивается дивиденд
- Процент выплаты: из `dividendYieldPct` (случайный в пределах грейда)
- Выплата **пропорциональна** `turnsHeldInCycle` — чем дольше держал, тем больше
- `turnsHeldInCycle` инкрементится каждый ход и сбрасывается при выплате
- Шанс получить дивидендную акцию при создании: F=1%, E=3%, D=8%, C=12%, B=20%, A=30%

---

## 8. IPO (ipo.manager.ts)

- Первое IPO возможно с **12-го хода**, затем каждые **8 ходов** с вероятностью **45%**
- Выбирается случайная компания грейда B или C (locked, не на бирже)
- Цель: повысить грейд до D/C/B в зависимости от хода (D: 12+, C: 25+, B: 40+)
- После выполнения IPO: грейд повышается, цена устанавливается на `ipoPrice`, `availableOnExchange` обновляется
- Игрок может подписаться на IPO (квота, списывается с баланса)

---

## 9. Комиссия при продаже (sell_commission.ts)

- Диапазон: **5–10%** от суммы сделки
- Зависит от `tradingLevel` персонажа (1→10%, 2→9%, ..., 6→5%)

---

## 10. Архетипы акций (stock_archetype.ts)

Классификация на основе сектора, грейда и дивидендного статуса:
- **`dividend`** — платит дивиденды
- **`speculative`** — грейд F или E
- **`defensive`** — HEALTHCARE с грейдом C/B/A
- **`growth`** — TECHNOLOGY грейда D/C/B с newsReactivity ≥ 1.1

---

## 11. Таблицы БД (Prisma)

- **`game_stock_listings`** — листинг акции в конкретной игре: грейд, цена, дивиденды
- **`price_history`** — история цен по ходам (одна запись за ход на листинг)
- **`news_pressures`** — активные давления новостей на листинг (impact, remainingTurns, decayRate)
- **`market_sentiments`** — глобальная рыночная сентиментация (одна строка на игру)
- **`sector_momentums`** — моментум по секторам
- **`stocks`** — портфели игроков (количество, цена покупки, turnsHeldInCycle)
- **`ipos`** — IPO-события
- **`scheduled_price_impacts`** — отложенные ценовые удары

---

## 12. Полный pipeline хода (MarketService.processTurn)

```
1. ensureMarketInitialized — создать листинги, если их нет
2. Обработать sentiment: дрейф к нулю
3. Обработать sector momentum: decay или уменьшение duration
4. decayNewsPressures — затухание всех активных давлений
5. Для каждого листинга:
   a. Собрать newsPressureTotal
   b. Получить sectorMomentum
   c. Рассчитать volatilityBoost
   d. Вычислить новую цену через calculateNextPrice
   e. Сохранить новую цену + запись в price_history
6. processTurn для IPO
7. processTurn для дивидендов
8. Создать новости о дивидендных выплатах
```

---

## 13. API endpoints

| Метод | Путь | Описание |
|-------|------|---------|
| GET | `/saves/:id/stocks` | Все листинги с историей |
| GET | `/saves/:id/stocks/:listingId` | Детальная информация |
| GET | `/saves/:id/stocks/:listingId/history` | История цен (20 точек) |
| POST | `/saves/:id/stocks/:listingId/buy` | Купить акции |
| POST | `/saves/:id/stocks/:listingId/sell` | Продать акции |
| GET | `/saves/:id/portfolio` | Портфель игрока |
| GET | `/saves/:id/stocks/sentiment` | Рыночная сентиментация |
| GET | `/saves/:id/stocks/sector-momentum` | Моментум секторов |
| POST | `/saves/:id/ipo/:ipoId/subscribe` | Подписаться на IPO |
