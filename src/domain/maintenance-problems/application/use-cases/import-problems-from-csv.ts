import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { CategoriesRepository } from '../repositories/categories-repository'
import { LocationsRepository } from '../repositories/locations-repository'
import { CreateProblemUseCase } from './create-problem'
import { ProblemAlreadyExistsError } from './errors/problem-already-exists-error'

export interface ImportProblemsFromCsvRow {
  rowNumber: number
  title: string
  description: string
  category: string
  location: string
}

export interface ImportProblemsFromCsvRequest {
  reporterId: string
  rows: ImportProblemsFromCsvRow[]
}

export interface ImportProblemsFromCsvResultItem {
  rowNumber: number
  title: string
  status: 'IMPORTED' | 'DUPLICATE' | 'INVALID'
  message: string
}

export interface ImportProblemsFromCsvResponse {
  imported: number
  duplicates: number
  invalid: number
  results: ImportProblemsFromCsvResultItem[]
}

type ImportProblemsFromCsvUseCaseResponse = Either<
  never,
  ImportProblemsFromCsvResponse
>

const TITLE_MAX_LENGTH = 100
const DESCRIPTION_MAX_LENGTH = 500

@Injectable()
export class ImportProblemsFromCsvUseCase {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly createProblemUseCase: CreateProblemUseCase,
  ) {}

  async execute({
    reporterId,
    rows,
  }: ImportProblemsFromCsvRequest): Promise<ImportProblemsFromCsvUseCaseResponse> {
    const seenFingerprints = new Set<string>()
    const response: ImportProblemsFromCsvResponse = {
      imported: 0,
      duplicates: 0,
      invalid: 0,
      results: [],
    }

    for (const row of rows) {
      const normalizedRow = {
        rowNumber: row.rowNumber,
        title: row.title.trim(),
        description: row.description.trim(),
        category: row.category.trim(),
        location: row.location.trim(),
      }

      const baseResult = {
        rowNumber: normalizedRow.rowNumber,
        title: normalizedRow.title || '(sem titulo)',
      }

      const validationError = this.validateRow(normalizedRow)

      if (validationError) {
        response.invalid++
        response.results.push({
          ...baseResult,
          status: 'INVALID',
          message: validationError,
        })
        continue
      }

      const category = await this.categoriesRepository.findByName(
        normalizedRow.category,
      )

      if (
        !category ||
        !category.isActive ||
        category.isInTrash ||
        category.isPurged
      ) {
        response.invalid++
        response.results.push({
          ...baseResult,
          status: 'INVALID',
          message: `Categoria "${normalizedRow.category}" não encontrada ou indisponível.`,
        })
        continue
      }

      const location = await this.locationsRepository.findByNameOrCode(
        normalizedRow.location,
      )

      if (
        !location ||
        !location.isActive ||
        location.isInTrash ||
        location.isPurged
      ) {
        response.invalid++
        response.results.push({
          ...baseResult,
          status: 'INVALID',
          message: `Localização "${normalizedRow.location}" não encontrada ou indisponível.`,
        })
        continue
      }

      const fingerprint = this.buildFingerprint({
        title: normalizedRow.title,
        description: normalizedRow.description,
        categoryId: category.id.toValue(),
        locationId: location.id.toValue(),
      })

      if (seenFingerprints.has(fingerprint)) {
        response.duplicates++
        response.results.push({
          ...baseResult,
          status: 'DUPLICATE',
          message: 'Linha duplicada no próprio arquivo.',
        })
        continue
      }

      seenFingerprints.add(fingerprint)

      const result = await this.createProblemUseCase.execute({
        reporterId,
        title: normalizedRow.title,
        description: normalizedRow.description,
        categoryId: category.id.toValue(),
        locationId: location.id.toValue(),
        attachmentsIds: [],
      })

      if (result.isLeft()) {
        if (result.value instanceof ProblemAlreadyExistsError) {
          response.duplicates++
          response.results.push({
            ...baseResult,
            status: 'DUPLICATE',
            message: 'Já existe um problema igual cadastrado.',
          })
          continue
        }

        response.invalid++
        response.results.push({
          ...baseResult,
          status: 'INVALID',
          message:
            'A categoria ou a localização desta linha não pode ser usada.',
        })
        continue
      }

      response.imported++
      response.results.push({
        ...baseResult,
        status: 'IMPORTED',
        message: 'Problema importado com sucesso.',
      })
    }

    return right(response)
  }

  private validateRow(row: ImportProblemsFromCsvRow): string | null {
    if (!row.title) {
      return 'Título é obrigatório.'
    }

    if (row.title.length > TITLE_MAX_LENGTH) {
      return `Título deve ter no máximo ${TITLE_MAX_LENGTH} caracteres.`
    }

    if (!row.description) {
      return 'Descrição é obrigatória.'
    }

    if (row.description.length > DESCRIPTION_MAX_LENGTH) {
      return `Descrição deve ter no máximo ${DESCRIPTION_MAX_LENGTH} caracteres.`
    }

    if (!row.category) {
      return 'Categoria é obrigatória.'
    }

    if (!row.location) {
      return 'Localização é obrigatória.'
    }

    return null
  }

  private buildFingerprint({
    title,
    description,
    categoryId,
    locationId,
  }: {
    title: string
    description: string
    categoryId: string
    locationId: string
  }) {
    return [
      title.trim().toLowerCase(),
      description.trim().toLowerCase(),
      categoryId,
      locationId,
    ].join('::')
  }
}
