-- CreateTable
CREATE TABLE "google_sheet_imports" (
    "id" TEXT NOT NULL,
    "spreadsheet_id" TEXT NOT NULL,
    "sheet_name" TEXT NOT NULL,
    "row_index" INTEGER NOT NULL,
    "problem_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_sheet_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "google_sheet_imports_spreadsheet_id_sheet_name_row_index_key" ON "google_sheet_imports"("spreadsheet_id", "sheet_name", "row_index");

-- AddForeignKey
ALTER TABLE "google_sheet_imports" ADD CONSTRAINT "google_sheet_imports_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
