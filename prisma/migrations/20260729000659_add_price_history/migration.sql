-- CreateTable
CREATE TABLE "price_history" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "averagePrice" DECIMAL(10,2) NOT NULL,
    "lowestPrice" DECIMAL(10,2) NOT NULL,
    "highestPrice" DECIMAL(10,2) NOT NULL,
    "soldCount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "price_history_cardId_idx" ON "price_history"("cardId");

-- CreateIndex
CREATE INDEX "price_history_createdAt_idx" ON "price_history"("createdAt");

-- CreateIndex
CREATE INDEX "price_history_cardId_createdAt_idx" ON "price_history"("cardId", "createdAt");

-- AddForeignKey
ALTER TABLE "price_history" ADD CONSTRAINT "price_history_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "card"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
