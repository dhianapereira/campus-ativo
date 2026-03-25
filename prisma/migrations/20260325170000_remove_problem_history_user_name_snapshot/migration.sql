ALTER TABLE "public"."problem_history"
DROP COLUMN "user_name";

ALTER TABLE "public"."problem_history"
ADD CONSTRAINT "problem_history_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
