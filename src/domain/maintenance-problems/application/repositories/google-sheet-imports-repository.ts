export interface GoogleSheetImportRecord {
  id: string
  spreadsheetId: string
  sheetName: string
  rowIndex: number
  problemId: string
  createdAt: Date
}

export abstract class GoogleSheetImportsRepository {
  abstract findByRow(
    spreadsheetId: string,
    sheetName: string,
    rowIndex: number,
  ): Promise<GoogleSheetImportRecord | null>

  abstract create(
    record: Omit<GoogleSheetImportRecord, 'id' | 'createdAt'>,
  ): Promise<void>
}
