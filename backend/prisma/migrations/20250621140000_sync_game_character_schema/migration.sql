-- CreateEnum
CREATE TYPE "Profession" AS ENUM ('DOCTOR', 'DEVELOPER', 'FINANCIER', 'FARMER', 'ENGINEER', 'STREET_CLEANER');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEGATIVE', 'NEUTRAL');

-- AlterEnum GameStatus: ARCHIVED -> INACTIVE
BEGIN;
CREATE TYPE "GameStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'PAUSED', 'COMPLETED');
ALTER TABLE "games" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "games" ALTER COLUMN "status" TYPE "GameStatus_new" USING (
  CASE "status"::text
    WHEN 'ARCHIVED' THEN 'INACTIVE'::"GameStatus_new"
    ELSE "status"::text::"GameStatus_new"
  END
);
ALTER TYPE "GameStatus" RENAME TO "GameStatus_old";
ALTER TYPE "GameStatus_new" RENAME TO "GameStatus";
DROP TYPE "GameStatus_old";
ALTER TABLE "games" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- MarketSector is unused; replace with current enum values
DROP TYPE "MarketSector";
CREATE TYPE "MarketSector" AS ENUM ('HEALTHCARE', 'TECHNOLOGY', 'FINANCE', 'AGRICULTURE', 'ENERGY');

-- Games: currentDay -> step, drop legacy tick/speed fields
ALTER TABLE "games" ADD COLUMN "step" INTEGER NOT NULL DEFAULT 1;
UPDATE "games" SET "step" = "currentDay";

ALTER TABLE "games"
  DROP COLUMN "currentDay",
  DROP COLUMN "dayProgress",
  DROP COLUMN "difficulty",
  DROP COLUMN "lastTickAt",
  DROP COLUMN "speed",
  DROP COLUMN "totalDays";

DROP TYPE "GameSpeed";

-- Characters: align with current Prisma model
ALTER TABLE "characters"
  ADD COLUMN "professionLevel" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "salary" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN "tradingLevel" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "isNpc" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "profession_enum" "Profession";

UPDATE "characters" SET
  "professionLevel" = "jobLevel",
  "tradingLevel" = GREATEST(0, ROUND("tradingSkill")::integer),
  "profession_enum" = CASE UPPER(COALESCE("profession", 'DEVELOPER'))
    WHEN 'DOCTOR' THEN 'DOCTOR'::"Profession"
    WHEN 'DEVELOPER' THEN 'DEVELOPER'::"Profession"
    WHEN 'FINANCIER' THEN 'FINANCIER'::"Profession"
    WHEN 'FARMER' THEN 'FARMER'::"Profession"
    WHEN 'ENGINEER' THEN 'ENGINEER'::"Profession"
    WHEN 'STREET_CLEANER' THEN 'STREET_CLEANER'::"Profession"
    ELSE 'DEVELOPER'::"Profession"
  END;

ALTER TABLE "characters" ALTER COLUMN "gameId" DROP NOT NULL;

ALTER TABLE "characters"
  DROP COLUMN "profession",
  DROP COLUMN "jobLevel",
  DROP COLUMN "jobExperience",
  DROP COLUMN "tradingSkill",
  DROP COLUMN "negotiationSkill",
  DROP COLUMN "analysisSkill",
  DROP COLUMN "energy",
  DROP COLUMN "stress",
  DROP COLUMN "health",
  DROP COLUMN "bestTrade",
  DROP COLUMN "worstTrade";

ALTER TABLE "characters" RENAME COLUMN "profession_enum" TO "profession";
ALTER TABLE "characters" ALTER COLUMN "profession" SET NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sector" "MarketSector" NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "itemRef" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "isInstallment" BOOLEAN NOT NULL DEFAULT false,
    "monthlyPayment" DOUBLE PRECISION,
    "installmentsTotal" INTEGER,
    "installmentsPaid" INTEGER NOT NULL DEFAULT 0,
    "special" TEXT,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPaidOff" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "impact" DOUBLE PRECISION NOT NULL,
    "sentiment" "Sentiment" NOT NULL DEFAULT 'NEUTRAL',
    "sector" "MarketSector",
    "companyId" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_ticker_key" ON "companies"("ticker");

-- CreateIndex
CREATE INDEX "companies_sector_idx" ON "companies"("sector");

-- CreateIndex
CREATE INDEX "inventory_items_characterId_idx" ON "inventory_items"("characterId");

-- CreateIndex
CREATE INDEX "news_companyId_idx" ON "news"("companyId");

-- CreateIndex
CREATE INDEX "news_sector_idx" ON "news"("sector");

-- CreateIndex
CREATE INDEX "news_expiresAt_idx" ON "news"("expiresAt");

-- CreateIndex
CREATE INDEX "price_history_companyId_idx" ON "price_history"("companyId");

-- CreateIndex
CREATE INDEX "price_history_companyId_timestamp_idx" ON "price_history"("companyId", "timestamp");

-- CreateIndex
CREATE INDEX "stocks_companyId_idx" ON "stocks"("companyId");

-- CreateIndex
CREATE INDEX "stocks_ownerId_idx" ON "stocks"("ownerId");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
