-- CreateTable
CREATE TABLE "stock_trades" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "sector" "MarketSector" NOT NULL,
    "operationType" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "netTotal" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "turn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_trades_pkey" PRIMARY KEY ("id")
);
