import {
  GoogleSheetImportsRepository,
  GoogleSheetImportRecord,
} from '@/domain/maintenance-problems/application/repositories/google-sheet-imports-repository'
import { randomUUID } from 'crypto'

export class InMemoryGoogleSheetImportsRepository
  implements GoogleSheetImportsRepository
{
  public items: GoogleSheetImportRecord[] = []

  async findByRow(
    spreadsheetId: string,
    sheetName: string,
    rowIndex: number,
  ): Promise<GoogleSheetImportRecord | null> {
    const record = this.items.find(
      (item) =>
        item.spreadsheetId === spreadsheetId &&
        item.sheetName === sheetName &&
        item.rowIndex === rowIndex,
    )

    return record ?? null
  }

  async create(
    record: Omit<GoogleSheetImportRecord, 'id' | 'createdAt'>,
  ): Promise<void> {
    this.items.push({
      ...record,
      id: randomUUID(),
      createdAt: new Date(),
    })
  }
}
