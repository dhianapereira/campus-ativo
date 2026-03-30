import { Either, right } from '@/core/either'
import { Injectable } from '@nestjs/common'
import { lookup } from 'node:dns/promises'
import type { LookupAddress } from 'node:dns'
import { isIP } from 'node:net'
import { CategoriesRepository } from '../repositories/categories-repository'
import { LocationsRepository } from '../repositories/locations-repository'
import { CreateProblemUseCase } from './create-problem'
import { ProblemAlreadyExistsError } from './errors/problem-already-exists-error'
import { Category } from '../../enterprise/entities/category'
import { Location } from '../../enterprise/entities/location'
import { UploadAttachmentUseCase } from './upload-attachment'
import { InvalidAttachmentTypeError } from './errors/invalid-attachment-type-error'
import { ProblemsRepository } from '../repositories/problems-repository'

export interface ImportProblemsFromCsvRow {
  rowNumber: number
  title: string
  description: string
  category: string
  locationName?: string
  locationCode?: string
  imageUrl?: string
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
const IMPORT_IMAGE_MAX_BYTES = 32 * 1024 * 1024
const IMPORT_IMAGE_TIMEOUT_MS = 15000
const DEFAULT_IMAGE_BASENAME = 'imagem-importada'
const ALLOWED_IMAGE_PORTS = new Set(['', '80', '443'])
const CONTENT_TYPE_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
}
const BLOCKED_IPV4_RANGES = [
  { start: '0.0.0.0', end: '0.255.255.255' },
  { start: '10.0.0.0', end: '10.255.255.255' },
  { start: '100.64.0.0', end: '100.127.255.255' },
  { start: '127.0.0.0', end: '127.255.255.255' },
  { start: '169.254.0.0', end: '169.254.255.255' },
  { start: '172.16.0.0', end: '172.31.255.255' },
  { start: '192.0.0.0', end: '192.0.0.255' },
  { start: '192.0.2.0', end: '192.0.2.255' },
  { start: '192.168.0.0', end: '192.168.255.255' },
  { start: '198.18.0.0', end: '198.19.255.255' },
  { start: '198.51.100.0', end: '198.51.100.255' },
  { start: '203.0.113.0', end: '203.0.113.255' },
  { start: '224.0.0.0', end: '255.255.255.255' },
]
const BLOCKED_IPV6_PREFIXES = [
  '::1',
  '::',
  'fc',
  'fd',
  'fe80',
  'ff',
  '2001:db8',
]

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

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function ipv4ToInteger(ip: string) {
  return ip
    .split('.')
    .map((segment) => Number.parseInt(segment, 10))
    .reduce((result, octet) => (result << 8) + octet, 0)
}

function isBlockedIpv4(ip: string) {
  const numericIp = ipv4ToInteger(ip)

  return BLOCKED_IPV4_RANGES.some(({ start, end }) => {
    return numericIp >= ipv4ToInteger(start) && numericIp <= ipv4ToInteger(end)
  })
}

function expandIpv6(ip: string) {
  if (ip === '::') {
    return new Array(8).fill('0000')
  }

  const [head, tail] = ip.toLowerCase().split('::')
  const headParts = head
    ? head.split(':').filter(Boolean)
    : []
  const tailParts = tail
    ? tail.split(':').filter(Boolean)
    : []
  const missingParts = 8 - (headParts.length + tailParts.length)

  if (missingParts < 0) {
    return null
  }

  return [...headParts, ...new Array(missingParts).fill('0'), ...tailParts].map(
    (part) => part.padStart(4, '0'),
  )
}

function isBlockedIpv6(ip: string) {
  const normalizedIp = ip.toLowerCase()
  const expanded = expandIpv6(normalizedIp)

  if (!expanded) {
    return true
  }

  const compact = expanded.join('')
  const textual = expanded.join(':')

  return BLOCKED_IPV6_PREFIXES.some((prefix) => {
    const normalizedPrefix = prefix.toLowerCase()
    return (
      textual.startsWith(normalizedPrefix) ||
      compact.startsWith(normalizedPrefix)
    )
  })
}

function isBlockedIpAddress(ip: string) {
  const version = isIP(ip)

  if (version === 4) {
    return isBlockedIpv4(ip)
  }

  if (version === 6) {
    return isBlockedIpv6(ip)
  }

  return true
}

@Injectable()
export class ImportProblemsFromCsvUseCase {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly locationsRepository: LocationsRepository,
    private readonly problemsRepository: ProblemsRepository,
    private readonly createProblemUseCase: CreateProblemUseCase,
    private readonly uploadAttachmentUseCase: UploadAttachmentUseCase,
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
        imageUrl: row.imageUrl?.trim() ?? '',
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

      const duplicateProblem = await this.problemsRepository.findDuplicate({
        title: normalizedRow.title,
        description: normalizedRow.description,
        categoryId: category.id.toValue(),
        locationId: location.id.toValue(),
      })

      if (duplicateProblem) {
        response.duplicates++
        response.results.push({
          ...baseResult,
          status: 'DUPLICATE',
          message: 'Já existe um problema igual cadastrado.',
        })
        continue
      }

      let attachmentIds: string[] = []

      if (normalizedRow.imageUrl) {
        const attachmentResult = await this.uploadRemoteImage(
          normalizedRow.imageUrl,
        )

        if ('error' in attachmentResult) {
          response.invalid++
          response.results.push({
            ...baseResult,
            status: 'INVALID',
            message: attachmentResult.error,
          })
          continue
        }

        attachmentIds = [attachmentResult.attachmentId]
      }

      const result = await this.createProblemUseCase.execute({
        reporterId,
        title: normalizedRow.title,
        description: normalizedRow.description,
        categoryId: category.id.toValue(),
        locationId: location.id.toValue(),
        attachmentsIds: attachmentIds,
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

    if (row.imageUrl?.trim() && !isValidHttpUrl(row.imageUrl)) {
      return 'A imagem deve usar uma URL http(s) válida.'
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

  private async uploadRemoteImage(
    imageUrl: string,
  ): Promise<{ attachmentId: string } | { error: string }> {
    const safetyCheck = await this.validateRemoteImageUrl(imageUrl)

    if (safetyCheck) {
      return { error: safetyCheck }
    }

    let response: Response

    try {
      response = await fetch(imageUrl, {
        signal: AbortSignal.timeout(IMPORT_IMAGE_TIMEOUT_MS),
        redirect: 'error',
      })
    } catch {
      return {
        error: 'Não foi possível baixar a imagem informada.',
      }
    }

    if (!response.ok) {
      return {
        error: `Não foi possível baixar a imagem informada (HTTP ${response.status}).`,
      }
    }

    const contentLengthHeader = response.headers.get('content-length')
    const contentLength = contentLengthHeader
      ? Number.parseInt(contentLengthHeader, 10)
      : Number.NaN

    if (
      Number.isFinite(contentLength) &&
      contentLength > IMPORT_IMAGE_MAX_BYTES
    ) {
      return {
        error: 'A imagem informada excede o limite de 32 MB.',
      }
    }

    let body: Buffer

    try {
      const arrayBuffer = await response.arrayBuffer()
      body = Buffer.from(arrayBuffer)
    } catch {
      return {
        error: 'Não foi possível ler a imagem informada.',
      }
    }

    if (body.byteLength > IMPORT_IMAGE_MAX_BYTES) {
      return {
        error: 'A imagem informada excede o limite de 32 MB.',
      }
    }

    const fileType = this.extractContentType(
      response.headers.get('content-type'),
    )

    if (!fileType) {
      return {
        error: 'A imagem informada não possui um tipo de arquivo suportado.',
      }
    }

    const uploadResult = await this.uploadAttachmentUseCase.execute({
      fileName: this.buildImageFileName(imageUrl, fileType),
      fileType,
      body,
    })

    if (uploadResult.isLeft()) {
      const message =
        uploadResult.value instanceof InvalidAttachmentTypeError
          ? 'A imagem informada não possui um tipo de arquivo suportado.'
          : 'Não foi possível anexar a imagem informada.'

      return { error: message }
    }

    return {
      attachmentId: uploadResult.value.attachment.id.toValue(),
    }
  }

  private async validateRemoteImageUrl(
    imageUrl: string,
  ): Promise<string | null> {
    let url: URL

    try {
      url = new URL(imageUrl)
    } catch {
      return 'A imagem deve usar uma URL http(s) válida.'
    }

    if (!ALLOWED_IMAGE_PORTS.has(url.port)) {
      return 'A imagem informada usa uma porta não permitida.'
    }

    if (
      url.username ||
      url.password ||
      url.hostname.toLowerCase() === 'localhost'
    ) {
      return 'A imagem informada usa um destino não permitido.'
    }

    if (isIP(url.hostname) !== 0) {
      return isBlockedIpAddress(url.hostname)
        ? 'A imagem informada usa um destino não permitido.'
        : null
    }

    let resolvedAddresses: LookupAddress[]

    try {
      resolvedAddresses = await lookup(url.hostname, { all: true })
    } catch {
      return 'Não foi possível validar o endereço da imagem informada.'
    }

    if (resolvedAddresses.length === 0) {
      return 'Não foi possível validar o endereço da imagem informada.'
    }

    const hasBlockedAddress = resolvedAddresses.some((entry) =>
      isBlockedIpAddress(entry.address),
    )

    if (hasBlockedAddress) {
      return 'A imagem informada usa um destino não permitido.'
    }

    return null
  }

  private extractContentType(contentTypeHeader: string | null) {
    if (!contentTypeHeader) {
      return null
    }

    const [contentType] = contentTypeHeader.split(';')
    const normalizedContentType = contentType.trim().toLowerCase()

    return CONTENT_TYPE_EXTENSION_MAP[normalizedContentType]
      ? normalizedContentType
      : null
  }

  private buildImageFileName(imageUrl: string, fileType: string) {
    const extension = CONTENT_TYPE_EXTENSION_MAP[fileType] ?? 'bin'

    try {
      const pathname = new URL(imageUrl).pathname
      const rawName = pathname.split('/').filter(Boolean).pop() ?? ''
      const sanitizedName = rawName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      if (sanitizedName && /\.[a-zA-Z0-9]+$/.test(sanitizedName)) {
        return sanitizedName.toLowerCase()
      }

      const baseName = sanitizedName || DEFAULT_IMAGE_BASENAME
      return `${baseName.toLowerCase()}.${extension}`
    } catch {
      return `${DEFAULT_IMAGE_BASENAME}.${extension}`
    }
  }
}
