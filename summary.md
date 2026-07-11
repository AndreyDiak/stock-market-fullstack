# Stock Market Simulator

A turn-based stock market simulation game built as a monorepo with a Fastify backend and React frontend.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Fastify 4, TypeScript 5 |
| ORM | Prisma 7 + PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | Yandex OAuth, Google OAuth, JWT (access + refresh), scrypt passwords |
| Validation | Zod → OpenAPI 3.1 |
| Frontend | React 19, Vite 8, Tailwind 4 |
| State | Zustand 5 |
| HTTP client | ky |
| Animations | framer-motion |
| Icons | @tabler/icons-react |
| Container | Docker Compose |

---

## Infrastructure

```yaml
# backend/docker-compose.yml
Services: postgres:16-alpine, redis:7-alpine, api (Fastify)
Ports:    5432 (PG), 6379 (Redis), 3000 (API)
```

Monorepo root with `npm workspaces` — packages: `backend` + `ui`.

---

## Backend

### Entry
- `src/server.ts` — Fastify bootstrap + graceful shutdown (SIGINT/SIGTERM)
- `src/app.ts` — `buildApp()` plugin registration (7 plugins + 6 route modules)

### Plugins
`error_handler`, `swagger`, `cors`, `prisma` (adapter-pg), `redis` (ioredis), `auth` (JWT + Yandex/Google OAuth2), `rate_limit`

### Modules

| Module | Routes | Purpose |
|---|---|---|
| **auth** | GET `/auth/yandex`, GET `/auth/google`, GET/POST `/auth/oauth`, POST `/auth/register`, POST `/auth/login`, POST `/auth/refresh`, POST `/auth/logout` | Yandex OAuth (popup), Google OAuth (redirect), password auth, token refresh/revoke |
| **users** | GET/PATCH `users/me` | Profile fetch & update |
| **characters** | GET `/characters` | Character roster for new game selection |
| **saves** | GET `/saves`, POST `/saves`, PATCH `/saves/:id`, DELETE `/saves/:id` | 3 game slots per user; create loads NPC template |
| **game** | GET/POST `/game/turn`, GET `/game/dashboard`, GET `/game/news` | End-turn pipeline (5 phases: economy → advance → market → offers → content), skill upgrades |
| **market** | GET `/market/listings`, POST `/market/buy`, POST `/market/sell`, GET `/market/portfolio`, GET `/market/ipos`, POST `/market/ipos/subscribe` | Stock exchange: grade-based pricing, volatility, dividends, IPO lifecycle |
| **news** | (part of game module) | Auto-generated news: market, rumor, insider, OTC, property, IPO |
| **property_offers** | GET/POST `/property-offers`, PATCH `/property-offers/:id/accept`, PATCH `/property-offers/:id/negotiate`, PATCH `/property-offers/:id/pay-off` | Buy/sell offers, installment plans, negotiation (dice-roll) |
| **otc_deals** | GET/POST `/otc-deals` | Over-the-counter deal acceptance |
| **character_skills** | Skill upgrade formulas | Each level improves a stat |

### Database (12 models + enums)

| Model | Fields |
|---|---|
| **User** | id, googleId, yandexId, email, displayName, avatar, passwordHash, createdAt, updatedAt |
| **Game** | id, userId, slot (1-3), step, status, name, startedAt, completedAt |
| **Character** | id, gameId (nullable), name, profession, salary, balance, reputation, skills (JSON), dreams (JSON), isNpc |
| **Company** | id, ticker (unique), name, sector, description, logo |
| **Stock** | id, companyId, basePrice, grade, volatility, dividendYield, dividendQuarter, archetype |
| **GameStockListing** | id, gameId, companyId, stockId, currentPrice, totalShares, availableShares, purchasedShares |
| **PriceHistory** | id, stockId? gameStockListingId?, price, turn |
| **News** | id, gameId, category, headline, body, sentiment, impact, ticker, turn |
| **InventoryItem** | id, characterId, itemRef, name, purchasePrice, isInstallment, monthlyPayment, installmentsTotal, installmentsPaid |
| **PropertyOffer** | id, gameId, characterId, type (BUY/SELL), itemRef, price, status, grade, profit |
| **IPO** | id, companyId, gameId, announcementTurn, openTurn, price, status |
| **ScheduledPriceImpact** | id, gameStockListingId, priceDelta, applyTurn, applied |
| **RefreshToken** | id, userId, token, expiresAt, revoked |

### Game Turn Pipeline (5 phases, synchronous)

1. **Economy Phase** — Salary (every 5 steps), living expenses (1-3 random receipts), installment payments, item pay-off news
2. **Advance Step** — `game.step += 1`
3. **Market Turn** — Sentiment drift, sector momentum decay, news pressure decay, price updates, dividends (10-turn cycle)
4. **Offers Expiry** — Deactivates expired property offers
5. **Content** — Generates news (stock → deal → realty cycle), OTC deals, property offers

### Market Engine
- Grade-based pricing (F→A), volatility, news-reactivity, sector spillover, market sentiment
- IPO manager: announces at turn 12, every 8 turns, 45% chance

---

## Frontend

### Routing

| Path | Page | Purpose |
|---|---|---|
| `/` | AuthPage | Login/register forms + Yandex OAuth |
| `/auth/complete` | OAuthCompletePage | OAuth popup callback → postMessage |
| `/menu` | MenuPage | Play, Settings, Logout |
| `/slots` | SlotsPage | 3 save slots grid (load/new/delete) |
| `/new-game` | NewGamePage | 6 characters grid + sidebar info |
| `/settings` | SettingsPage | Theme, background, music, SFX |
| `/game` | GameDashboardPage | Main game screen |

### Stores (Zustand)

| Store | Key State |
|---|---|
| `auth.store` | accessToken, isAuthenticated |
| `users.store` | User profile |
| `characters.store` | Character roster for new game |
| `saves.store` | 3 game slots with full game state |
| `game.store` | Central game state (~876 lines): dashboard, turn, news, market, portfolio, properties, OTC |
| `game_settings.store` | Theme, music, SFX, sidebar (persisted to localStorage) |

### API Layer (`src/api/`)
`auth.ts`, `gameTurn.ts`, `stocks.ts`, `propertyOffers.ts`, `propertyLoans.ts`, `otcDeals.ts` — typed wrappers around `src/lib/http.ts` (ky instance with Bearer token + auto-refresh interceptor).

### Game Dashboard

3-column layout with 6 tabs in left sidebar:

| Tab | Content |
|---|---|
| **Character** | Profile info, skills (with upgrade modal), stat infographic, reputation, work card |
| **Bank** | Loans, paid properties, payoff modals, property finance summary, operation history |
| **Exchange** | Stock listings with filters, portfolio, IPOs, buy/sell modals, charts (sparkline + modal), market sentiment bar, sector badges |
| **OTC** | Bot deal cards |
| **Real Estate** | Property offers (buy/sell), profit grade badges, negotiation (dice roll + slider), installment purchase, accept modals |
| **News** | News feed, newspaper modal, insider badges, cycle indicator |
| **Settings** | In-game look & feel |

Right panel: Work block, next-turn forecast, property inventory, news ticker.

### NPC System
6 named NPCs across professions (Street Cleaner → Doctor). Each has salary, starter inventory (on installment), dreams (wishlist). Used for OTC deal generation (30% chance per content cycle).

### Assets
- `src/assets/` — Profession portraits (8 PNGs), background.png
- `src/constants/` — Companies (40 tickers), real estate catalog, professions, images, OAuth config

---

## Key Business Rules

- **3 save slots** per user, each tied to one character
- **Salary** paid every 5 turns; **living expenses** deducted 1-3 random receipts per turn
- **Installments** progress each turn; early pay-off available from bank tab
- **Stock grades** (F→A) affect pricing and volatility
- **Dividends** proportional to turns held, distributed every 10 turns
- **Negotiation** for real estate: slider 5-50% discount + dice roll success
- **News** triggers: market-wide (news pressure), sector-specific (momentum), insider (delayed price impact)
- **IPO**: announced at turn 12, subscription window, allocation

---

## Running

```bash
# Start infrastructure
docker compose -f backend/docker-compose.yml up -d

# Backend
npm run dev --workspace=backend    # :3000

# Frontend
npm run dev --workspace=ui         # :5173

# Codegen (after backend changes)
npm run openapi                    # export → openapi-typescript
```

Prerequisites: Node.js, Docker, Yandex OAuth app credentials in `backend/.env`.
