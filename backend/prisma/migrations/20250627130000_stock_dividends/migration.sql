-- AlterTable
ALTER TABLE "game_stock_listings" ADD COLUMN "paysDividends" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "game_stock_listings" ADD COLUMN "dividendInterval" INTEGER;
ALTER TABLE "game_stock_listings" ADD COLUMN "dividendYieldPct" DOUBLE PRECISION;
ALTER TABLE "game_stock_listings" ADD COLUMN "turnsUntilDividend" INTEGER;
