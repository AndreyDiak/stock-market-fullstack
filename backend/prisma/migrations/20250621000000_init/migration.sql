-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MarketSector" AS ENUM ('TECHNOLOGY', 'HEALTHCARE', 'FINANCE', 'ENERGY', 'CONSUMER_GOODS', 'REAL_ESTATE', 'INDUSTRIAL');

-- CreateEnum
CREATE TYPE "GameSpeed" AS ENUM ('PAUSED', 'SLOW', 'NORMAL', 'FAST');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "googleId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Новая игра',
    "slot" SMALLINT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'ACTIVE',
    "speed" "GameSpeed" NOT NULL DEFAULT 'NORMAL',
    "currentDay" INTEGER NOT NULL DEFAULT 1,
    "dayProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastTickAt" TIMESTAMP(3),
    "totalDays" INTEGER NOT NULL DEFAULT 0,
    "difficulty" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalPlayTime" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 10000,
    "savings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profession" TEXT,
    "jobLevel" INTEGER NOT NULL DEFAULT 1,
    "jobExperience" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reputation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tradingSkill" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "negotiationSkill" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "analysisSkill" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "energy" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "stress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "health" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "successfulTrades" INTEGER NOT NULL DEFAULT 0,
    "bestTrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "worstTrade" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "games_userId_slot_key" ON "games"("userId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "characters_gameId_key" ON "characters"("gameId");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
