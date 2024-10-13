/*
  Warnings:

  - Added the required column `module_name` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `network` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `package_id` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "module_name" TEXT NOT NULL,
ADD COLUMN     "network" TEXT NOT NULL,
ADD COLUMN     "package_id" TEXT NOT NULL;
