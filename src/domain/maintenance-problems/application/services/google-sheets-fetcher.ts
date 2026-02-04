/**
 * Representa uma linha da planilha do Google Sheets.
 * rowIndex é 1-based (primeira linha de dados = 1, ignorando cabeçalho)
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
