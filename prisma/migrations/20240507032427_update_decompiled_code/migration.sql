/*
  Warnings:

  - Added the required column `bytecode_hash` to the `DecompiledCode` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DecompiledCode" ADD COLUMN     "bytecode_hash" TEXT NOT NULL;
