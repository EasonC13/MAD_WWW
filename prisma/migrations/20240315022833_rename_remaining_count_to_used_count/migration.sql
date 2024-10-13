/*
  Warnings:

  - You are about to drop the column `remaining_count` on the `Voucher` table. All the data in the column will be lost.
  - Added the required column `used_count` to the `Voucher` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Voucher" DROP COLUMN "remaining_count",
ADD COLUMN     "used_count" INTEGER NOT NULL;
