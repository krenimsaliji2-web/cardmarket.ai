-- AlterTable
ALTER TABLE "seller_profile" DROP COLUMN "followerCount";

-- CreateTable
CREATE TABLE "seller_follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "sellerProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seller_follow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seller_follow_followerId_idx" ON "seller_follow"("followerId");

-- CreateIndex
CREATE INDEX "seller_follow_sellerProfileId_idx" ON "seller_follow"("sellerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "seller_follow_followerId_sellerProfileId_key" ON "seller_follow"("followerId", "sellerProfileId");

-- AddForeignKey
ALTER TABLE "seller_follow" ADD CONSTRAINT "seller_follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_follow" ADD CONSTRAINT "seller_follow_sellerProfileId_fkey" FOREIGN KEY ("sellerProfileId") REFERENCES "seller_profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
