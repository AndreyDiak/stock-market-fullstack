-- Merge savings into balance and remove separate savings column
UPDATE "characters" SET "balance" = "balance" + "savings";

ALTER TABLE "characters" DROP COLUMN "savings";
