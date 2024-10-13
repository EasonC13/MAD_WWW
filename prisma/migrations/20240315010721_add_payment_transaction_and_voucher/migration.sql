-- CreateTable
CREATE TABLE "PaidTransaction" (
    "id" SERIAL NOT NULL,
    "tx_digest" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "coin_type" TEXT NOT NULL,
    "sender" TEXT NOT NULL,

    CONSTRAINT "PaidTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "total_count" INTEGER NOT NULL,
    "remaining_count" INTEGER NOT NULL,
    "user" TEXT NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);
