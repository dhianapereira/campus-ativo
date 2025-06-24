/*
  Warnings:

  - You are about to drop the column `user_id` on the `problems` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `problems` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `reporter_id` to the `problems` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `problems` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "problems" DROP CONSTRAINT "problems_user_id_fkey";

-- AlterTable
ALTER TABLE "problems" DROP COLUMN "user_id",
ADD COLUMN     "reporter_id" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "problems_slug_key" ON "problems"("slug");

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
