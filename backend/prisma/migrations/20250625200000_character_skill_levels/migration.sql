ALTER TABLE "characters" ADD COLUMN "bankingLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "characters" ADD COLUMN "propertySlotLevel" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "characters" ALTER COLUMN "tradingLevel" SET DEFAULT 0;

UPDATE "characters"
SET "tradingLevel" = GREATEST(0, "tradingLevel" - 1)
WHERE "isNpc" = false AND "tradingLevel" > 0;
