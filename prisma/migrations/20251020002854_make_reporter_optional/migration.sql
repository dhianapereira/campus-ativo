-- DropForeignKey
ALTER TABLE "public"."problems" DROP CONSTRAINT "problems_reporter_id_fkey";

-- AlterTable
ALTER TABLE "public"."problems" ALTER COLUMN "reporter_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."problems" ADD CONSTRAINT "problems_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
