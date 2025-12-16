-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "is_permanently_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."locations" ADD COLUMN     "is_permanently_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "public"."problems" ADD COLUMN     "is_permanently_deleted" BOOLEAN NOT NULL DEFAULT false;
