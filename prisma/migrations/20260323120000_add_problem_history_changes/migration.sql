ALTER TYPE "public"."HistoryAction" ADD VALUE 'UPDATED';

ALTER TABLE "public"."problem_history"
ADD COLUMN "changes" JSONB;
