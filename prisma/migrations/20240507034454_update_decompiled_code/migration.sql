/*
  Warnings:

  - You are about to drop the column `bytecode_hash` on the `DecompiledCode` table. All the data in the column will be lost.
  - You are about to drop the column `module_name` on the `DecompiledCode` table. All the data in the column will be lost.
  - You are about to drop the column `package_id` on the `DecompiledCode` table. All the data in the column will be lost.
  - Added the required column `bytecodeHash` to the `DecompiledCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `modelVersion` to the `DecompiledCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `moduleName` to the `DecompiledCode` table without a default value. This is not possible if the table is not empty.
  - Added the required column `packageId` to the `DecompiledCode` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "DecompiledCode_package_id_module_name_network_idx";

-- AlterTable
ALTER TABLE "DecompiledCode" DROP COLUMN "bytecode_hash",
DROP COLUMN "module_name",
DROP COLUMN "package_id",
ADD COLUMN     "bytecodeHash" TEXT NOT NULL,
ADD COLUMN     "modelVersion" TEXT NOT NULL,
ADD COLUMN     "moduleName" TEXT NOT NULL,
ADD COLUMN     "packageId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "decompiled_code_unique_index" ON "DecompiledCode"("packageId", "moduleName", "network", "modelVersion", "bytecodeHash");
