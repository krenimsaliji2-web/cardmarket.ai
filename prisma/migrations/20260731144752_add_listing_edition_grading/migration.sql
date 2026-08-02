-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "edition" TEXT,
ADD COLUMN     "grading" TEXT,
ADD COLUMN     "isFirstEdition" BOOLEAN NOT NULL DEFAULT false;
