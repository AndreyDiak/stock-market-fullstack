-- CreateTable
CREATE TABLE "deal_offers" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "botCharacterId" TEXT NOT NULL,
    "botGives" JSONB NOT NULL,
    "playerGives" JSONB NOT NULL,
    "requiredReputation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputationPenalty" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "playerBenefitValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "playerBenefitPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "turnCreated" INTEGER NOT NULL DEFAULT 1,
    "expiresTurn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "deal_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "deal_offers_gameId_status_idx" ON "deal_offers"("gameId", "status");

-- AddForeignKey
ALTER TABLE "deal_offers" ADD CONSTRAINT "deal_offers_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
