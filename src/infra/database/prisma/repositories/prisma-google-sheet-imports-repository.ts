import {
  GoogleSheetImportsRepository,
  GoogleSheetImportRecord,
} from '@/domain/maintenance-problems/application/repositories/google-sheet-imports-repository'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { randomUUID } from 'crypto'

@Injectable()
export class PrismaGoogleSheetImportsRepository
  implements GoogleSheetImportsRepository
{
  constructor(private prisma: PrismaService) {}

  async findByRow(
    spreadsheetId: string,
    sheetName: string,
    rowIndex: number,
  ): Promise<GoogleSheetImportRecord | null> {
    const record = await this.prisma.googleSheetImport.findUnique({
      where: {
        spreadsheetId_sheetName_rowIndex: {
          spreadsheetId,
          sheetName,
          rowIndex,
        },
      },
    })

    if (!record) {
      return null
    }

    return {
      id: record.id,
      spreadsheetId: record.spreadsheetId,
      sheetName: record.sheetName,
      rowIndex: record.rowIndex,
      problemId: record.problemId,
      createdAt: record.createdAt,
    }
  }

  async create(
    record: Omit<GoogleSheetImportRecord, 'id' | 'createdAt'>,
  ): Promise<void> {
    await this.prisma.googleSheetImport.create({
      data: {
        id: randomUUID(),
        spreadsheetId: record.spreadsheetId,
        sheetName: record.sheetName,
        rowIndex: record.rowIndex,
        problemId: record.problemId,
      },
    })
  }
}
