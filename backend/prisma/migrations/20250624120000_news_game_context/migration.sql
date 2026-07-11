-- AlterTable
ALTER TABLE "news" ADD COLUMN "gameId" TEXT;
ALTER TABLE "news" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'MARKET';
ALTER TABLE "news" ADD COLUMN "payload" JSONB;

-- CreateIndex
CREATE INDEX "news_gameId_idx" ON "news"("gameId");

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;
