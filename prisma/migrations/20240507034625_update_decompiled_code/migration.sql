/*
  Warnings:

  - You are about to drop the column `code` on the `DecompiledCode` table. All the data in the column will be lost.
  - Added the required column `decompiledCode` to the `DecompiledCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DecompiledCode" DROP COLUMN "code",
ADD COLUMN     "decompiledCode" TEXT NOT NULL;
