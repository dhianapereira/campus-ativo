DELETE FROM "public"."problem_history"
WHERE "action" = 'CATEGORY_CHANGED';

UPDATE "public"."problem_history"
SET "changes" = (
  SELECT CASE
    WHEN COUNT(*) = 0 THEN NULL
    ELSE jsonb_agg(change_item)
  END
  FROM jsonb_array_elements(COALESCE("changes"::jsonb, '[]'::jsonb)) AS change_item
  WHERE change_item->>'field' <> 'category'
)
WHERE "changes" IS NOT NULL;

ALTER TYPE "public"."HistoryAction" RENAME TO "HistoryAction_old";

CREATE TYPE "public"."HistoryAction" AS ENUM (
  'STATUS_CHANGED',
  'MAINTENANCE_TYPE_CHANGED',
  'NOTE_ADDED',
  'UPDATED'
);

ALTER TABLE "public"."problem_history"
ALTER COLUMN "action" TYPE "public"."HistoryAction"
USING ("action"::text::"public"."HistoryAction");

DROP TYPE "public"."HistoryAction_old";
