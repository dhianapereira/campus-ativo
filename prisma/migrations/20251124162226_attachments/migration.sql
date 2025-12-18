-- DropForeignKey
ALTER TABLE "public"."attachments" DROP CONSTRAINT "attachments_problem_id_fkey";

-- AlterTable
ALTER TABLE "public"."attachments" ALTER COLUMN "problem_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."attachments" ADD CONSTRAINT "attachments_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE SET NULL ON UPDATE CASCADE;
