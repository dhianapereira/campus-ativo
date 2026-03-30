ALTER TYPE "public"."HistoryAction" RENAME TO "ProblemHistoryAction";

CREATE TYPE "public"."ProblemHistoryChangeField" AS ENUM ('STATUS', 'MAINTENANCE_TYPE', 'NOTE');

CREATE TABLE "public"."problem_history_changes" (
    "id" TEXT NOT NULL,
    "history_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "field" "public"."ProblemHistoryChangeField" NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,

    CONSTRAINT "problem_history_changes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "problem_history_changes_history_id_position_key"
ON "public"."problem_history_changes"("history_id", "position");

ALTER TABLE "public"."problem_history_changes"
ADD CONSTRAINT "problem_history_changes_history_id_fkey"
FOREIGN KEY ("history_id") REFERENCES "public"."problem_history"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "public"."problem_history_changes" (
    "id",
    "history_id",
    "position",
    "field",
    "old_value",
    "new_value"
)
SELECT
    gen_random_uuid()::text,
    ph."id",
    change_item.ordinality - 1,
    CASE change_item.value->>'field'
        WHEN 'status' THEN 'STATUS'::"public"."ProblemHistoryChangeField"
        WHEN 'maintenanceType' THEN 'MAINTENANCE_TYPE'::"public"."ProblemHistoryChangeField"
        WHEN 'note' THEN 'NOTE'::"public"."ProblemHistoryChangeField"
    END,
    change_item.value->>'oldValue',
    change_item.value->>'newValue'
FROM "public"."problem_history" ph
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ph."changes"::jsonb, '[]'::jsonb))
WITH ORDINALITY AS change_item(value, ordinality)
WHERE change_item.value->>'field' IN ('status', 'maintenanceType', 'note');

ALTER TABLE "public"."problem_history"
DROP COLUMN "changes";
