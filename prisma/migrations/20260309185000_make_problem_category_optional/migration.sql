-- AlterTable
ALTER TABLE "public"."problems"
ALTER COLUMN "category_id" DROP NOT NULL;

-- DropForeignKey
ALTER TABLE "public"."problems" DROP CONSTRAINT "problems_category_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."problems"
ADD CONSTRAINT "problems_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
