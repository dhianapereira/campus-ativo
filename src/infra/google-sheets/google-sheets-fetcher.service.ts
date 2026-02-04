import {
  GoogleSheetsFetcher,
  GoogleSheetRow,
} from '@/domain/maintenance-problems/application/services/google-sheets-fetcher'
import { Injectable } from '@nestjs/common'
import { google } from 'googleapis'

@Injectable()
export class GoogleSheetsFetcherService implements GoogleSheetsFetcher {
  async fetchRows(
    spreadsheetId: string,
    sheetName: string,
    range?: string,
  ): Promise<GoogleSheetRow[]> {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

    if (!clientEmail || !privateKey) {
      throw new Error(
        'Google Sheets não configurado. Defina GOOGLE_SHEETS_CLIENT_EMAIL e GOOGLE_SHEETS_PRIVATE_KEY.',
      )
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    const rangeNotation = range ?? `${sheetName}!A:Z`

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: rangeNotation,
    })

    const rows = response.data.values as string[][] | undefined

    if (!rows || rows.length < 2) {
      return []
    }

    // Primeira linha é o cabeçalho, dados começam na linha 2
    const dataRows = rows.slice(1)

    return dataRows.map((values, index) => ({
      rowIndex: index + 2,
      values: values.map((v) => String(v ?? '').trim()),
    }))
  }
}
