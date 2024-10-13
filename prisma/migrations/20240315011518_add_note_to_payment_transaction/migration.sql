/*
  Warnings:

  - You are about to drop the `PaidTransaction` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PaidTransaction";

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" SERIAL NOT NULL,
    "tx_digest" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "coin_type" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "note" TEXT,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);
