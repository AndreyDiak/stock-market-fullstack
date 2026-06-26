ALTER TABLE "characters" ALTER COLUMN "tradingLevel" SET DEFAULT 1;
ALTER TABLE "characters" ALTER COLUMN "bankingLevel" SET DEFAULT 1;
ALTER TABLE "characters" ALTER COLUMN "propertySlotLevel" SET DEFAULT 1;

UPDATE "characters"
SET
  "tradingLevel" = GREATEST(1, "tradingLevel"),
  "bankingLevel" = GREATEST(1, "bankingLevel"),
  "propertySlotLevel" = GREATEST(1, "propertySlotLevel")
WHERE "isNpc" = false;

UPDATE "characters"
SET "professionLevel" = GREATEST(1, "professionLevel")
WHERE "isNpc" = false AND "professionLevel" < 1;
