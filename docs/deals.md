# Сделки (Deal Offers)

Обмен пакетами активов между игроком и NPC-ботом. Каждая сторона отдаёт **набор** (`DealBundle`) из `CASH`, `STOCK` и/или `PROPERTY`.

Источники: `backend/src/modules/deals/`, `backend/src/modules/game/_phases/_turn_content.phase.ts`.

> **Не путать с:** OTC-сделками (`otc_deals/`) и предложениями недвижимости (`property_offers/`). Это отдельные механики.

---

## Когда появляются

Контент хода крутится по циклу **stock → deal → realty** (`news_cycle.ts`). Примерно **каждый 3-й ход** — ход сделки.

На ходе `deal` (`TurnContentPhase`):

1. Выбирается случайный NPC
2. `DealGenerator.maybeGenerate()` — до **16 попыток**
3. При успехе: запись в `deal_offers` с `purpose`, новость `DEAL_OFFER`
4. При провале: fallback на биржевую новость

---

## Типы сделок (purpose)

| Purpose | Вес | Бот отдаёт | Игрок отдаёт |
|---------|-----|------------|--------------|
| `DREAM_HELPER` | 3–4* | 1× PROPERTY (роскошь) | **CASH + STOCK** (+ cheaper PROPERTY) |
| `STOCK_PACKAGE` | 1–2* | STOCK | **только CASH** |
| `LIQUIDITY` | 1* | CASH | **только STOCK** (из портфеля) |
| `VALUE_EXCHANGE` | 1 | CASH или STOCK | CASH + опционально STOCK ≤30% |

\* `STOCK_PACKAGE` — если на бирже есть акции. Вес **2** при пустом портфеле. Игроку **не нужно** владеть бумагами заранее; бот предлагает любые листинги, `requiredTradingLevel` — по грейду акций.  
\* `DREAM_HELPER` — вес **4** при отсутствии выкупленной недвижимости. Формула: **деньги + акции + более дешёвая недвижимость (опционально) = роскошь**. Бот может запросить trade-in: `trade_pavilion→car_wash`, `tractor→combine`, `car→sport_car`, `apartment→penthouse`, а также любую подходящую более дешёвую недвижимость из мечты или инвентаря игрока.  
\* `LIQUIDITY` — только при `lowCash && portfolio ≥ 10 000`.

Подписи UI: К мечте / Пакет акций / Быстрые деньги / Обмен.

`purpose` **сохраняется в БД** (`DealPurpose` enum), fallback для старых записей: `VALUE_EXCHANGE`.

Роскошь (`dealOnly` в каталоге) **не попадает на рынок недвижимости** — только через сделки. Сейчас: пентхаус, автомойка, спорткар, яхта, трактор, комбайн. Обычный автомобиль остаётся на рынке как промежуточный актив. В `DREAM_HELPER` бот предлагает только `dealOnly`-объекты.

Категория **A** на рынке недвижимости: выгода **50–60%** относительно рыночной цены (требуется Banking 6).

---

## Платёжеспособность

```
cashCapacity  = round(balance × 0.85)
stockCapacity = round(Σ(shares × price × 0.85))
```

| Purpose | Capacity для размера сделки |
|---------|---------------------------|
| DREAM_HELPER | аспирационно (без лимита `cashCapacity` при генерации) |
| STOCK_PACKAGE | аспирационно при низком балансе |
| LIQUIDITY | `stockCapacity` |
| VALUE_EXCHANGE | cash-first, stock ≤30% bundle |

**LIQUIDITY** генерируется только если:

```
isLowCash = balance < nextExpense × 2 || balance < 10 000
hasPortfolio = portfolioValue ≥ 10 000
```

---

## Лимиты выгоды

| Purpose | benefitPercent |
|---------|----------------|
| DREAM_HELPER | −5% … +10% |
| STOCK_PACKAGE | −10% … +12% |
| LIQUIDITY | −20% … −5% |
| VALUE_EXCHANGE | −10% … +10% |

Глобально: −30% … +25%.

Для **LIQUIDITY** bot cash считается от стоимости акций игрока:

```
botCash = round(playerStockValue × (1 + benefitPercent / 100))
```

---

## Требования к игроку

### requiredTradingLevel

| Purpose | Логика |
|---------|--------|
| DREAM_HELPER, LIQUIDITY, VALUE_EXCHANGE | `1` |
| STOCK_PACKAGE | max grade акций в пакете (F=1 … A=6) |

**Не зависит от NPC** (раньше брался `npc.tradingLevel`).

### Акции и недвижимость

- **DREAM_HELPER**: бот отдаёт роскошь; игрок отдаёт **деньги + акции**, при trade-up — ещё и пререквизит-недвижимость
- **STOCK_PACKAGE** и **VALUE_EXCHANGE** (бот отдаёт акции): портфель игрока **не нужен** при генерации
- **LIQUIDITY** и stock в **VALUE_EXCHANGE** от игрока: только из уже купленных бумаг
- При **accept** проверка повторяется (мог продать/потратить после генерации)

---

## Prisma

```prisma
enum DealPurpose {
  VALUE_EXCHANGE
  LIQUIDITY
  DREAM_HELPER
  STOCK_PACKAGE
}

model DealOffer {
  purpose DealPurpose @default(VALUE_EXCHANGE)
  ...
}
```

Миграция: `20260710120000_add_deal_purpose`.

---

## API

| Метод | Путь |
|-------|------|
| `POST` | `/saves/:id/deals/accept` |

Reject endpoint **удалён** — отклонение через истечение срока.

Список сделок: `GET /saves/:id/dashboard`, `POST /saves/:id/end-turn` → поле **`dealOffers`** (массив).

---

## UI

- `purpose` из backend payload
- Кнопка «Торговаться» **скрыта**
- Только «Принять»
- LIQUIDITY с отрицательным benefit: «Оценочный убыток», без агрессивного красного UI
- После `endTurn`: `deals = dealOffers ?? []` (без залипания пустого списка)

---

## EXPIRED

В `AdvanceStepPhase` после `step++`:

```sql
UPDATE deal_offers SET status = 'EXPIRED'
WHERE status = 'ACTIVE' AND expiresTurn < currentStep
```

---

## Ключевые файлы

| Backend | Frontend |
|---------|----------|
| `deal.builder.ts` | `_deal_card.tsx` |
| `deal.validator.ts` | `_deal_purpose.ts` |
| `deal.generator.ts` | `game.store.ts` |
| `deal_offer.prisma` | `gameTurn.ts` |

Тесты: `backend/tests/modules/deal.generator.test.ts`
