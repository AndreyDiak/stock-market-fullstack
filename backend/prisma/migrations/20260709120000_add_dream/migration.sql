-- CreateTable
CREATE TABLE "dreams" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "dreamType" TEXT NOT NULL,
    "currentStage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "dreams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dream_stages" (
    "id" TEXT NOT NULL,
    "dreamId" TEXT NOT NULL,
    "stageIndex" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LOCKED',
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "dream_stages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dreams_characterId_key" ON "dreams"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "dream_stages_dreamId_stageIndex_key" ON "dream_stages"("dreamId", "stageIndex");

-- AddForeignKey
ALTER TABLE "dreams" ADD CONSTRAINT "dreams_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dream_stages" ADD CONSTRAINT "dream_stages_dreamId_fkey" FOREIGN KEY ("dreamId") REFERENCES "dreams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
