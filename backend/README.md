# Stock Simulator Backend



Backend for the stock market simulator built with Fastify, Prisma, PostgreSQL, and Redis.



## Prerequisites



- Node.js 20+ (for local UI and optional local backend)

- Docker and Docker Compose



## Quick Start (Docker)



1. Copy environment variables:



```bash

cp .env.example .env

```



Fill in `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`, and other secrets in `.env`.



2. Start the full stack (Postgres, Redis, API):



```bash

npm run docker:up

```



The API runs at `http://localhost:3000` with hot reload — changes in `src/` and `prisma/` are picked up automatically.



3. Seed test data (first run or after reset):



```bash

docker compose exec api npm run db:seed

```



Or set `RUN_SEED=true` in `.env` before `docker compose up` to seed on startup.



4. Start the UI locally:



```bash

cd ../ui

npm run dev

```



UI: `http://localhost:5173` — API proxy and OAuth callback URL stay the same (`localhost:3000`).



### Docker commands



| Command | Description |

|---------|-------------|

| `npm run docker:up` | Build and start all services in background |

| `npm run docker:down` | Stop and remove containers |

| `npm run docker:logs` | Follow API logs |

| `npm run docker:prod` | Production image (compiled, no volume mounts) |



## Quick Start (Local backend)



If you prefer running the API on the host while keeping DB in Docker:



```bash

docker compose up -d postgres redis

npm install

npm run db:migrate:dev

npm run db:seed

npm run dev

```



Use `localhost` in `DATABASE_URL` and `REDIS_URL` in `.env` (see `.env.example`).



## Scripts



| Script | Description |

|--------|-------------|

| `npm run dev` | Start dev server with hot reload (local) |

| `npm run build` | Compile TypeScript |

| `npm start` | Run production build |

| `npm run db:migrate:dev` | Create and apply migrations (dev) |

| `npm run db:migrate` | Apply migrations (production) |

| `npm run db:seed` | Seed database with test data |

| `npm test` | Run tests |



## API Endpoints



### Auth

- `GET /auth/yandex` — Initiate Yandex OAuth

- `GET /auth/yandex/callback` — Yandex OAuth callback

- `GET /auth/google` — Initiate Google OAuth (optional, if configured)

- `GET /auth/google/callback` — Google OAuth callback

- `POST /auth/refresh` — Refresh access token

- `POST /auth/logout` — Logout and revoke refresh token



### Users

- `GET /users/me` — Get current user profile

- `PATCH /users/me` — Update profile



### Saves

- `GET /saves` — List user's saves

- `POST /saves` — Create save with character

- `GET /saves/:id` — Get save details

- `PATCH /saves/:id` — Update save

- `DELETE /saves/:id` — Delete save

### Game (turn)

- `POST /saves/:id/end-turn` — End current turn

- `GET /saves/:id/dashboard` — Dashboard data (game, news, forecast)

- `GET /saves/:id/news` — News feed

- `GET /saves/:id/next-turn-forecast` — Next turn forecast



### Health

- `GET /health` — Health check (Postgres + Redis)



## OpenAPI & Type Generation



Export the OpenAPI spec (no Docker required):



```bash

npm run openapi:export

```



Interactive docs are available at `http://localhost:3000/docs` when the server is running.



From the repo root, regenerate frontend types:



```bash

npm run openapi

```



This writes `openapi.json` and regenerates `ui/src/api/schema.d.ts`.



## Tests



Tests use a separate database. Set `DATABASE_URL` to point to `stock_simulator_test` or use the default test configuration in `.env`.



```bash

npm test

```


