/**
 * Represents a row fetched from Google Sheets.
 * `rowIndex` is 1-based for data rows, excluding the header.
 */
export interface GoogleSheetRow {
  rowIndex: number
  values: string[]
}

export abstract class GoogleSheetsFetcher {
  abstract fetchRows(
    spreadsheetId: string,
    sheetName: string,
    range?: string,
  ): Promise<GoogleSheetRow[]>
}
