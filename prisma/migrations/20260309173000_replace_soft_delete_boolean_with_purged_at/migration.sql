-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN "purged_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."locations" ADD COLUMN "purged_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."problems" ADD COLUMN "purged_at" TIMESTAMP(3);

-- Backfill purged_at from previous permanent-delete flag
UPDATE "public"."categories"
SET "purged_at" = COALESCE("deleted_at", NOW())
WHERE "is_permanently_deleted" = true;

UPDATE "public"."locations"
SET "purged_at" = COALESCE("deleted_at", NOW())
WHERE "is_permanently_deleted" = true;

UPDATE "public"."problems"
SET "purged_at" = COALESCE("deleted_at", NOW())
WHERE "is_permanently_deleted" = true;

-- Remove old boolean flag
ALTER TABLE "public"."categories" DROP COLUMN "is_permanently_deleted";
ALTER TABLE "public"."locations" DROP COLUMN "is_permanently_deleted";
ALTER TABLE "public"."problems" DROP COLUMN "is_permanently_deleted";
