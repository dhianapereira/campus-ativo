/*
  Warnings:

  - Added the required column `location_name` to the `problems` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."problems" DROP CONSTRAINT "problems_location_id_fkey";

-- AlterTable: Primeiro adiciona a coluna com valor default
ALTER TABLE "public"."problems" ADD COLUMN "location_name" TEXT;

-- Preenche location_name com o nome da location atual
UPDATE "public"."problems"
SET "location_name" = (
  SELECT "name"
  FROM "public"."locations"
  WHERE "locations"."id" = "problems"."location_id"
);

-- Agora torna a coluna NOT NULL
ALTER TABLE "public"."problems" ALTER COLUMN "location_name" SET NOT NULL;

-- Torna location_id nullable
ALTER TABLE "public"."problems" ALTER COLUMN "location_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."problems" ADD CONSTRAINT "problems_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
