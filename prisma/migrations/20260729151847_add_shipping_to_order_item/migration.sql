-- CreateEnum
CREATE TYPE "shipping_carrier" AS ENUM ('SWISS_POST', 'DHL', 'UPS', 'FEDEX', 'DPD', 'GLS', 'OTHER');

-- AlterTable
ALTER TABLE "order_item" ADD COLUMN     "deliveredAt" TIMESTAMPTZ(3),
ADD COLUMN     "shippedAt" TIMESTAMPTZ(3),
ADD COLUMN     "shippingCarrier" "shipping_carrier",
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "trackingUrl" TEXT;
