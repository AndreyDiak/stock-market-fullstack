-- CreateEnum
CREATE TYPE "PriceDirection" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "ScheduledPriceImpactStatus" AS ENUM ('PENDING', 'APPLIED', 'CANCELLED');

-- AlterTable
ALTER TABLE "price_history" ADD COLUMN "gameId" TEXT;

-- CreateTable
CREATE TABLE "scheduled_price_impacts" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "newsId" TEXT,
    "direction" "PriceDirection" NOT NULL,
    "movePercent" DOUBLE PRECISION NOT NULL,
    "createdAtStep" INTEGER NOT NULL,
    "triggerAtStep" INTEGER NOT NULL,
    "status" "ScheduledPriceImpactStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAtStep" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scheduled_price_impacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_company_quotes" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "game_company_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_price_impacts_gameId_status_triggerAtStep_idx" ON "scheduled_price_impacts"("gameId", "status", "triggerAtStep");

-- CreateIndex
CREATE INDEX "scheduled_price_impacts_companyId_idx" ON "scheduled_price_impacts"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "game_company_quotes_gameId_companyId_key" ON "game_company_quotes"("gameId", "companyId");

-- CreateIndex
CREATE INDEX "game_company_quotes_gameId_idx" ON "game_company_quotes"("gameId");

-- CreateIndex
CREATE INDEX "price_history_gameId_idx" ON "price_history"("gameId");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_price_impacts" ADD CONSTRAINT "scheduled_price_impacts_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_price_impacts" ADD CONSTRAINT "scheduled_price_impacts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_price_impacts" ADD CONSTRAINT "scheduled_price_impacts_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_company_quotes" ADD CONSTRAINT "game_company_quotes_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_company_quotes" ADD CONSTRAINT "game_company_quotes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
