-- Align starter character stats with game design defaults.
ALTER TABLE "characters" ALTER COLUMN "reputation" SET DEFAULT 3;
ALTER TABLE "characters" ALTER COLUMN "tradingLevel" SET DEFAULT 1;
