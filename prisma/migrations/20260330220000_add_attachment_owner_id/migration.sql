ALTER TABLE "attachments"
ADD COLUMN "owner_id" TEXT NOT NULL,
ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "attachments"
ADD CONSTRAINT "attachments_owner_id_fkey"
FOREIGN KEY ("owner_id") REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE INDEX "attachments_owner_id_idx" ON "attachments"("owner_id");
