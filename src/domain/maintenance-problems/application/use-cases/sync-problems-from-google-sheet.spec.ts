import { SyncProblemsFromGoogleSheetUseCase } from './sync-problems-from-google-sheet'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { InMemoryGoogleSheetImportsRepository } from 'test/repositories/in-memory-google-sheet-imports-repository'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { FakeGoogleSheetsFetcher } from 'test/google-sheets/fake-google-sheets-fetcher'
import { makeCategory } from 'test/factories/make-category'
import { makeLocation } from 'test/factories/make-location'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeSystemUser } from 'test/factories/make-user'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryLocationsRepository: InMemoryLocationsRepository
let inMemoryGoogleSheetImportsRepository: InMemoryGoogleSheetImportsRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let inMemoryUsersRepository: InMemoryUsersRepository
let fakeGoogleSheetsFetcher: FakeGoogleSheetsFetcher
let sut: SyncProblemsFromGoogleSheetUseCase

describe('Sync Problems From Google Sheet', () => {
  const spreadsheetId = 'test-spreadsheet-id'
  const sheetName = 'Formulário 1'

  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    inMemoryGoogleSheetImportsRepository =
      new InMemoryGoogleSheetImportsRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    inMemoryUsersRepository = new InMemoryUsersRepository()
    fakeGoogleSheetsFetcher = new FakeGoogleSheetsFetcher()

    sut = new SyncProblemsFromGoogleSheetUseCase(
      fakeGoogleSheetsFetcher,
      inMemoryGoogleSheetImportsRepository,
      inMemoryProblemsRepository,
      inMemoryCategoriesRepository,
      inMemoryLocationsRepository,
      inMemoryAttachmentsRepository,
      inMemoryUsersRepository,
    )
  })

  it('deve importar problemas novos da planilha', async () => {
    const systemUser = makeSystemUser()
    const category = makeCategory({ name: 'Climatização' })
    const location = makeLocation({ name: 'Sala 101' })
    inMemoryUsersRepository.items.push(systemUser)
    inMemoryCategoriesRepository.items.push(category)
    inMemoryLocationsRepository.items.push(location)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          'Ar condicionado quebrado',
          'O ar da sala 101 não está funcionando',
          'Climatização',
          'Sala 101',
        ],
      },
    ]

    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(1)
    expect(result.value?.skipped).toBe(0)
    expect(inMemoryProblemsRepository.items).toHaveLength(1)
    expect(inMemoryProblemsRepository.items[0].title).toBe(
      'Ar condicionado quebrado',
    )
    expect(inMemoryProblemsRepository.items[0].description).toBe(
      'O ar da sala 101 não está funcionando',
    )
    expect(inMemoryProblemsRepository.items[0].reporterId.toValue()).toBe(
      systemUser.id.toValue(),
    )
    expect(inMemoryGoogleSheetImportsRepository.items).toHaveLength(1)
    expect(inMemoryGoogleSheetImportsRepository.items[0].rowIndex).toBe(2)
  })

  it('não deve importar linhas já importadas (evitar duplicatas)', async () => {
    inMemoryUsersRepository.items.push(makeSystemUser())
    const category = makeCategory({ name: 'Elétrica' })
    const location = makeLocation({ name: 'Bloco A' })
    inMemoryCategoriesRepository.items.push(category)
    inMemoryLocationsRepository.items.push(location)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          'Lâmpada queimada',
          'Lâmpada do corredor queimou',
          'Elétrica',
          'Bloco A',
        ],
      },
    ]

    await sut.execute({ spreadsheetId, sheetName })
    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(0)
    expect(result.value?.skipped).toBe(1)
    expect(inMemoryProblemsRepository.items).toHaveLength(1)
  })

  it('deve pular linhas com título ou descrição vazios', async () => {
    inMemoryUsersRepository.items.push(makeSystemUser())
    const category = makeCategory({ name: 'Hidráulica' })
    inMemoryCategoriesRepository.items.push(category)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          '',
          'Descrição vazia',
          'Hidráulica',
          'Banheiro',
        ],
      },
      {
        rowIndex: 3,
        values: ['01/02/2025 11:00', 'Título só', '', 'Hidráulica', 'Banheiro'],
      },
    ]

    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(0)
    expect(result.value?.skipped).toBe(2)
    expect(inMemoryProblemsRepository.items).toHaveLength(0)
  })

  it('deve registrar erro quando categoria não existe', async () => {
    inMemoryUsersRepository.items.push(makeSystemUser())
    const location = makeLocation({ name: 'Sala 201' })
    inMemoryLocationsRepository.items.push(location)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          'Problema válido',
          'Descrição válida',
          'Categoria Inexistente',
          'Sala 201',
        ],
      },
    ]

    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(0)
    expect(result.value?.skipped).toBe(1)
    expect(result.value?.errors).toHaveLength(1)
    expect(result.value?.errors[0]).toContain(
      'Categoria "Categoria Inexistente" não encontrada',
    )
    expect(inMemoryProblemsRepository.items).toHaveLength(0)
  })

  it('deve registrar erro quando localização não existe', async () => {
    inMemoryUsersRepository.items.push(makeSystemUser())
    const category = makeCategory({ name: 'Outros' })
    inMemoryCategoriesRepository.items.push(category)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          'Problema em local novo',
          'Descrição do problema',
          'Outros',
          'Área externa - estacionamento',
        ],
      },
    ]

    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(0)
    expect(result.value?.skipped).toBe(1)
    expect(result.value?.errors).toHaveLength(1)
    expect(result.value?.errors[0]).toContain(
      'Localização "Área externa - estacionamento" não encontrada',
    )
    expect(inMemoryProblemsRepository.items).toHaveLength(0)
  })

  it('deve importar múltiplas linhas e ignorar duplicatas na mesma execução', async () => {
    inMemoryUsersRepository.items.push(makeSystemUser())
    const category = makeCategory({ name: 'Climatização' })
    const location = makeLocation({ name: 'Sala 101' })
    inMemoryCategoriesRepository.items.push(category)
    inMemoryLocationsRepository.items.push(location)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          'Problema 1',
          'Descrição 1',
          'Climatização',
          'Sala 101',
        ],
      },
      {
        rowIndex: 3,
        values: [
          '01/02/2025 11:00',
          'Problema 2',
          'Descrição 2',
          'Climatização',
          'Sala 101',
        ],
      },
    ]

    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(2)
    expect(inMemoryProblemsRepository.items).toHaveLength(2)
    expect(inMemoryProblemsRepository.items[0].title).toBe('Problema 1')
    expect(inMemoryProblemsRepository.items[1].title).toBe('Problema 2')
  })

  it('deve criar attachment quando a linha tem URL de imagem válida', async () => {
    inMemoryUsersRepository.items.push(makeSystemUser())
    const category = makeCategory({ name: 'Outros' })
    const location = makeLocation({ name: 'Sala 1' })
    inMemoryCategoriesRepository.items.push(category)
    inMemoryLocationsRepository.items.push(location)

    fakeGoogleSheetsFetcher.rows = [
      {
        rowIndex: 2,
        values: [
          '01/02/2025 10:00',
          'Problema com foto',
          'Descrição',
          'Outros',
          'Sala 1',
          'https://drive.google.com/file/d/abc123/view',
        ],
      },
    ]

    const result = await sut.execute({ spreadsheetId, sheetName })

    expect(result.isRight()).toBe(true)
    expect(result.value?.imported).toBe(1)
    expect(inMemoryAttachmentsRepository.items).toHaveLength(1)
    expect(inMemoryAttachmentsRepository.items[0].title).toBe(
      'Imagem do formulário',
    )
    expect(inMemoryAttachmentsRepository.items[0].link).toBe(
      'https://drive.google.com/file/d/abc123/view',
    )
    const problemAttachmentIds =
      inMemoryAttachmentsRepository.problemAttachmentMap.get(
        inMemoryProblemsRepository.items[0].id.toValue(),
      )

    expect(problemAttachmentIds).toContain(
      inMemoryAttachmentsRepository.items[0].id.toValue(),
    )
  })
})
