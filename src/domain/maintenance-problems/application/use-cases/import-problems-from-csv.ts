import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { CategoriesRepository } from '../repositories/categories-repository'
import { LocationsRepository } from '../repositories/locations-repository'
import { CreateProblemUseCase } from './create-problem'
import { ProblemAlreadyExistsError } from './errors/problem-already-exists-error'
import { Category } from '../../enterprise/entities/category'
import { Location } from '../../enterprise/entities/location'

export interface ImportProblemsFromCsvRow {
  rowNumber: number
  title: string
  description: string
  category: string
  locationName?: string
  locationCode?: string
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
const LOOKUP_PAGE_SIZE = 200

function normalizeLookupValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function pickLocationInput(row: ImportProblemsFromCsvRow) {
  return {
    locationName: row.locationName?.trim() ?? '',
    locationCode: row.locationCode?.trim() ?? '',
  }
}

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
    const [categories, locations] = await Promise.all([
      this.loadAvailableCategories(),
      this.loadAvailableLocations(),
    ])
    const categoryMap = new Map<string, Category>()
    const locationCodeMap = new Map<string, Location>()
    const locationNameMap = new Map<string, Location[]>()

    categories.forEach((category) => {
      categoryMap.set(normalizeLookupValue(category.name), category)
    })

    locations.forEach((location) => {
      const normalizedName = normalizeLookupValue(location.name)
      const locationsWithSameName = locationNameMap.get(normalizedName) ?? []

      locationsWithSameName.push(location)
      locationNameMap.set(normalizedName, locationsWithSameName)

      if (location.code) {
        locationCodeMap.set(normalizeLookupValue(location.code), location)
      }
    })

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
        ...pickLocationInput(row),
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

      const category = categoryMap.get(
        normalizeLookupValue(normalizedRow.category),
      )

      if (!category) {
        response.invalid++
        response.results.push({
          ...baseResult,
          status: 'INVALID',
          message: `Categoria "${normalizedRow.category}" não encontrada ou indisponível.`,
        })
        continue
      }

      const locationResolution = this.resolveLocation(
        normalizedRow,
        locationCodeMap,
        locationNameMap,
      )

      if ('error' in locationResolution) {
        response.invalid++
        response.results.push({
          ...baseResult,
          status: 'INVALID',
          message: locationResolution.error,
        })
        continue
      }

      const location = locationResolution.location

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

    if (!row.locationName?.trim()) {
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

  private async loadAvailableCategories() {
    const categories: Category[] = []
    let page = 1

    while (true) {
      const result = await this.categoriesRepository.findMany({
        page,
        pageSize: LOOKUP_PAGE_SIZE,
        isActive: true,
      })

      categories.push(...result.items)

      if (categories.length >= result.total) {
        return categories
      }

      page++
    }
  }

  private async loadAvailableLocations() {
    const locations: Location[] = []
    let page = 1

    while (true) {
      const result = await this.locationsRepository.findMany({
        page,
        pageSize: LOOKUP_PAGE_SIZE,
        isActive: true,
      })

      locations.push(...result.items)

      if (locations.length >= result.total) {
        return locations
      }

      page++
    }
  }

  private resolveLocation(
    row: {
      locationName: string
      locationCode: string
    },
    locationCodeMap: Map<string, Location>,
    locationNameMap: Map<string, Location[]>,
  ): { location: Location } | { error: string } {
    if (row.locationCode) {
      const locationByCode = locationCodeMap.get(
        normalizeLookupValue(row.locationCode),
      )

      if (!locationByCode) {
        return {
          error: `Código de localização "${row.locationCode}" não encontrado ou indisponível.`,
        }
      }

      if (
        row.locationName &&
        normalizeLookupValue(locationByCode.name) !==
          normalizeLookupValue(row.locationName)
      ) {
        return {
          error: `O código "${row.locationCode}" não corresponde à localização "${row.locationName}".`,
        }
      }

      return { location: locationByCode }
    }

    if (!row.locationName) {
      return { error: 'Localização é obrigatória.' }
    }

    const locationsByName =
      locationNameMap.get(normalizeLookupValue(row.locationName)) ?? []

    if (locationsByName.length === 0) {
      return {
        error: `Localização "${row.locationName}" não encontrada ou indisponível.`,
      }
    }

    if (locationsByName.length > 1) {
      return {
        error: `A localização "${row.locationName}" está ambígua. Informe também o código da localização.`,
      }
    }

    return { location: locationsByName[0] }
  }
}
