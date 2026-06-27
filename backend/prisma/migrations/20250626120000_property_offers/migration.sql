-- AlterTable
ALTER TABLE "characters" ADD COLUMN "tradeSuccessStreak" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "property_offers" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "type" TEXT NOT NULL,
    "offerPrice" DOUBLE PRECISION NOT NULL,
    "marketPrice" DOUBLE PRECISION NOT NULL,
    "profitPercent" DOUBLE PRECISION NOT NULL,
    "profitGrade" TEXT NOT NULL,
    "requiredBankingLevel" INTEGER NOT NULL,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "expiresInTurns" INTEGER NOT NULL,
    "expiresAtTurn" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "property_offers_gameId_isActive_idx" ON "property_offers"("gameId", "isActive");

-- AddForeignKey
ALTER TABLE "property_offers" ADD CONSTRAINT "property_offers_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
