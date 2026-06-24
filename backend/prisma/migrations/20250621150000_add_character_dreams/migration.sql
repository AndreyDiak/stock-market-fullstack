-- AlterTable
ALTER TABLE "characters" ADD COLUMN "dreamItemRefs" TEXT[] DEFAULT ARRAY[]::TEXT[];
