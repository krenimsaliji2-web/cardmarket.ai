-- AlterTable
ALTER TABLE "card" ADD COLUMN     "attributes" JSONB,
ADD COLUMN     "subtypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "supertype" TEXT,
ADD COLUMN     "types" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "set" ALTER COLUMN "coverImage" DROP NOT NULL;
