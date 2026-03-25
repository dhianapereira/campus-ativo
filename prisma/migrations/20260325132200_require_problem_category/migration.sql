-- DropForeignKey
ALTER TABLE "public"."problems" DROP CONSTRAINT "problems_category_id_fkey";

-- AlterTable
ALTER TABLE "public"."problems"
ALTER COLUMN "category_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."problems"
ADD CONSTRAINT "problems_category_id_fkey"
FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
