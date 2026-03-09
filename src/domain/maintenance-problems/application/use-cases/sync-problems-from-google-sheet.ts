import { Problem } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'
import { Attachment } from '@/domain/maintenance-problems/enterprise/entities/attachment'
import { ProblemsRepository } from '../repositories/problems-repository'
import { CategoriesRepository } from '../repositories/categories-repository'
import { LocationsRepository } from '../repositories/locations-repository'
import { GoogleSheetImportsRepository } from '../repositories/google-sheet-imports-repository'
import { AttachmentsRepository } from '../repositories/attachments-repository'
import { GoogleSheetsFetcher } from '../services/google-sheets-fetcher'
import { right, Either } from '@/core/either'
import { Injectable } from '@nestjs/common'

/**
 * Índices das colunas na planilha (0-based).
 * Formato esperado: [Timestamp, Título, Descrição, Categoria, Localização, Imagem (opcional)]
 */
const COLUMN_INDEX = {
  TITLE: 1,
  DESCRIPTION: 2,
  CATEGORY: 3,
  LOCATION: 4,
  IMAGE_URL: 5,
} as const

export interface SyncProblemsFromGoogleSheetRequest {
  spreadsheetId: string
  sheetName?: string
}

export interface SyncProblemsFromGoogleSheetResponse {
  imported: number
  skipped: number
  errors: string[]
}

type SyncProblemsFromGoogleSheetResult = Either<
  never,
  SyncProblemsFromGoogleSheetResponse
>

@Injectable()
export class SyncProblemsFromGoogleSheetUseCase {
  constructor(
    private googleSheetsFetcher: GoogleSheetsFetcher,
    private googleSheetImportsRepository: GoogleSheetImportsRepository,
    private problemsRepository: ProblemsRepository,
    private categoriesRepository: CategoriesRepository,
    private locationsRepository: LocationsRepository,
    private attachmentsRepository: AttachmentsRepository,
  ) {}

  async execute({
    spreadsheetId,
    sheetName = 'Formulário 1',
  }: SyncProblemsFromGoogleSheetRequest): Promise<SyncProblemsFromGoogleSheetResult> {
    const result: SyncProblemsFromGoogleSheetResponse = {
      imported: 0,
      skipped: 0,
      errors: [],
    }

    const rows = await this.googleSheetsFetcher.fetchRows(
      spreadsheetId,
      sheetName,
    )

    for (const row of rows) {
      try {
        const alreadyImported =
          await this.googleSheetImportsRepository.findByRow(
            spreadsheetId,
            sheetName,
            row.rowIndex,
          )

        if (alreadyImported) {
          result.skipped++
          continue
        }

        const title = row.values[COLUMN_INDEX.TITLE]?.trim()
        const description = row.values[COLUMN_INDEX.DESCRIPTION]?.trim()
        const categoryName = row.values[COLUMN_INDEX.CATEGORY]?.trim()
        const locationName = row.values[COLUMN_INDEX.LOCATION]?.trim()

        if (!title || !description) {
          result.skipped++
          continue
        }

        const category = categoryName
          ? await this.categoriesRepository.findByName(categoryName)
          : null

        if (!category) {
          result.errors.push(
            `Linha ${row.rowIndex}: Categoria "${categoryName || '(vazia)'}" não encontrada`,
          )
          result.skipped++
          continue
        }

        const location = locationName
          ? await this.locationsRepository.findByName(locationName)
          : null

        const problem = Problem.create({
          reporterId: null,
          locationId: location ? location.id : null,
          locationName: location?.name ?? locationName ?? 'Não informado',
          categoryId: category.id,
          title,
          description,
        })

        await this.problemsRepository.create(problem)

        await this.googleSheetImportsRepository.create({
          spreadsheetId,
          sheetName,
          rowIndex: row.rowIndex,
          problemId: problem.id.toValue(),
        })

        const imageUrl = row.values[COLUMN_INDEX.IMAGE_URL]?.trim()
        if (imageUrl && this.isValidUrl(imageUrl)) {
          try {
            const attachment = Attachment.create({
              title: 'Imagem do formulário',
              link: imageUrl,
            })
            await this.attachmentsRepository.create(attachment, {
              problemId: problem.id.toValue(),
            })
          } catch {
            // Linha já registrada como importada; problema fica sem anexo
          }
        }

        result.imported++
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Erro desconhecido'
        result.errors.push(`Linha ${row.rowIndex}: ${message}`)
        result.skipped++
      }
    }

    return right(result)
  }

  private isValidUrl(str: string): boolean {
    try {
      const url = new URL(str)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }
}
