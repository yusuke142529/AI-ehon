/*
  Warnings:

  - You are about to drop the column `artStyle` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "artStyle",
ADD COLUMN     "artStyleCategory" TEXT,
ADD COLUMN     "artStyleId" INTEGER;
