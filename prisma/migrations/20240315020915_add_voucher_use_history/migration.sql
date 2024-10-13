-- CreateTable
CREATE TABLE "VoucherUseHistory" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "user" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherUseHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VoucherUseHistory" ADD CONSTRAINT "VoucherUseHistory_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
