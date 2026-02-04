/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  GoogleSheetsFetcher,
  GoogleSheetRow,
} from '@/domain/maintenance-problems/application/services/google-sheets-fetcher'

export class FakeGoogleSheetsFetcher implements GoogleSheetsFetcher {
  public rows: GoogleSheetRow[] = []

  async fetchRows(
    _spreadsheetId: string,
    _sheetName: string,
    _range?: string,
  ): Promise<GoogleSheetRow[]> {
    return this.rows
  }
}
