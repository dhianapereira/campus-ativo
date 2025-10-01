-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "locations" ADD COLUMN     "deleted_at" TIMESTAMP(3);
