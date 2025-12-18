/*
  Warnings:

  - Made the column `vector` on table `Embedding` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "EmailMessage_searchVector_idx";

-- AlterTable
ALTER TABLE "Embedding" ALTER COLUMN "vector" SET NOT NULL;
