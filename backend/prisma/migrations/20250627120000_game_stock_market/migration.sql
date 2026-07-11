-- CreateEnum
CREATE TYPE "StockGrade" AS ENUM ('F', 'E', 'D', 'C', 'B', 'A');

-- CreateEnum
CREATE TYPE "SectorTrend" AS ENUM ('rising', 'falling', 'neutral');

-- CreateTable
CREATE TABLE "game_stock_listings" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "grade" "StockGrade" NOT NULL DEFAULT 'F',
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "previousPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dayChange" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableOnExchange" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_stock_listings_pkey" PRIMARY KEY ("id")
);

-- Migrate existing quotes into listings
INSERT INTO "game_stock_listings" (
    "id",
    "gameId",
    "companyId",
    "grade",
    "currentPrice",
    "previousPrice",
    "dayChange",
    "availableOnExchange",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "gameId",
    "companyId",
    'F'::"StockGrade",
    "currentPrice",
    "currentPrice",
    0,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "game_company_quotes";

-- CreateTable
CREATE TABLE "news_pressures" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "newsId" TEXT,
    "stockListingId" TEXT NOT NULL,
    "impact" DOUBLE PRECISION NOT NULL,
    "remainingTurns" INTEGER NOT NULL,
    "decayRate" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "news_pressures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_sentiments" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_sentiments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_momentums" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "sector" "MarketSector" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "trend" "SectorTrend" NOT NULL DEFAULT 'neutral',
    "catalyst" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sector_momentums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipos" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "targetGrade" "StockGrade" NOT NULL,
    "ipoPrice" DOUBLE PRECISION NOT NULL,
    "ipoShares" INTEGER NOT NULL,
    "announcedAtTurn" INTEGER NOT NULL,
    "ipoAtTurn" INTEGER NOT NULL,
    "minSubscription" INTEGER NOT NULL DEFAULT 10,
    "maxSubscription" INTEGER NOT NULL DEFAULT 500,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ipo_subscriptions" (
    "id" TEXT NOT NULL,
    "ipoId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ipo_subscriptions_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "price_history" ADD COLUMN "stockListingId" TEXT;
ALTER TABLE "price_history" ADD COLUMN "turn" INTEGER;

-- AlterTable
ALTER TABLE "stocks" ADD COLUMN "gameId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "game_stock_listings_gameId_companyId_key" ON "game_stock_listings"("gameId", "companyId");
CREATE INDEX "game_stock_listings_gameId_idx" ON "game_stock_listings"("gameId");
CREATE INDEX "game_stock_listings_companyId_idx" ON "game_stock_listings"("companyId");

CREATE INDEX "news_pressures_gameId_stockListingId_idx" ON "news_pressures"("gameId", "stockListingId");
CREATE INDEX "news_pressures_stockListingId_idx" ON "news_pressures"("stockListingId");

CREATE UNIQUE INDEX "market_sentiments_gameId_key" ON "market_sentiments"("gameId");

CREATE UNIQUE INDEX "sector_momentums_gameId_sector_key" ON "sector_momentums"("gameId", "sector");
CREATE INDEX "sector_momentums_gameId_idx" ON "sector_momentums"("gameId");

CREATE INDEX "ipos_gameId_isCompleted_idx" ON "ipos"("gameId", "isCompleted");

CREATE UNIQUE INDEX "ipo_subscriptions_ipoId_playerId_key" ON "ipo_subscriptions"("ipoId", "playerId");
CREATE INDEX "ipo_subscriptions_ipoId_idx" ON "ipo_subscriptions"("ipoId");

CREATE INDEX "price_history_stockListingId_turn_idx" ON "price_history"("stockListingId", "turn");
CREATE INDEX "stocks_gameId_idx" ON "stocks"("gameId");
CREATE INDEX "stocks_ownerId_companyId_gameId_idx" ON "stocks"("ownerId", "companyId", "gameId");

-- Backfill price history listing links where possible
UPDATE "price_history" ph
SET "stockListingId" = gsl."id"
FROM "game_stock_listings" gsl
WHERE ph."gameId" = gsl."gameId"
  AND ph."companyId" = gsl."companyId"
  AND ph."stockListingId" IS NULL;

-- AddForeignKey
ALTER TABLE "game_stock_listings" ADD CONSTRAINT "game_stock_listings_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_stock_listings" ADD CONSTRAINT "game_stock_listings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "news_pressures" ADD CONSTRAINT "news_pressures_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "news_pressures" ADD CONSTRAINT "news_pressures_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "news_pressures" ADD CONSTRAINT "news_pressures_stockListingId_fkey" FOREIGN KEY ("stockListingId") REFERENCES "game_stock_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "market_sentiments" ADD CONSTRAINT "market_sentiments_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sector_momentums" ADD CONSTRAINT "sector_momentums_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ipos" ADD CONSTRAINT "ipos_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ipos" ADD CONSTRAINT "ipos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ipo_subscriptions" ADD CONSTRAINT "ipo_subscriptions_ipoId_fkey" FOREIGN KEY ("ipoId") REFERENCES "ipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_history" ADD CONSTRAINT "price_history_stockListingId_fkey" FOREIGN KEY ("stockListingId") REFERENCES "game_stock_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stocks" ADD CONSTRAINT "stocks_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop legacy quote table
DROP TABLE "game_company_quotes";
