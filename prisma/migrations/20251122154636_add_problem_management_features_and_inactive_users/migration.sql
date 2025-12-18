-- CreateEnum
CREATE TYPE "public"."HistoryAction" AS ENUM ('STATUS_CHANGED', 'CATEGORY_CHANGED', 'MAINTENANCE_TYPE_CHANGED', 'NOTE_ADDED');

-- AlterTable
ALTER TABLE "public"."problems" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "is_active" SET DEFAULT false;

-- CreateTable
CREATE TABLE "public"."problem_history" (
    "id" TEXT NOT NULL,
    "problem_id" TEXT NOT NULL,
    "action" "public"."HistoryAction" NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "problem_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."problem_history" ADD CONSTRAINT "problem_history_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "public"."problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
