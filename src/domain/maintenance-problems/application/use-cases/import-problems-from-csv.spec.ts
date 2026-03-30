import { lookup } from 'node:dns/promises'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CreateProblemUseCase } from './create-problem'
import { ImportProblemsFromCsvUseCase } from './import-problems-from-csv'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { InMemoryProblemAttachmentLinksStore } from 'test/repositories/in-memory-problem-attachment-links-store'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryAttachmentsRepository } from 'test/repositories/in-memory-attachments-repository'
import { makeLocation } from 'test/factories/make-location'
import { makeCategory } from 'test/factories/make-category'
import { FakeUploader } from 'test/upload/fake-uploader'
import { UploadAttachmentUseCase } from './upload-attachment'

vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(),
}))

function mockLookupAll(addresses: Array<{ address: string; family: 4 | 6 }>) {
  vi.mocked(lookup).mockImplementation(async () => addresses as never)
}

let inMemoryProblemAttachmentLinksStore: InMemoryProblemAttachmentLinksStore
let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryLocationsRepository: InMemoryLocationsRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryAttachmentsRepository: InMemoryAttachmentsRepository
let fakeUploader: FakeUploader
let createProblemUseCase: CreateProblemUseCase
let uploadAttachmentUseCase: UploadAttachmentUseCase
let sut: ImportProblemsFromCsvUseCase

describe('Import Problems From CSV', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentLinksStore =
      new InMemoryProblemAttachmentLinksStore()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentLinksStore,
    )
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryAttachmentsRepository = new InMemoryAttachmentsRepository()
    fakeUploader = new FakeUploader()

    createProblemUseCase = new CreateProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryLocationsRepository,
      inMemoryCategoriesRepository,
    )
    uploadAttachmentUseCase = new UploadAttachmentUseCase(
      fakeUploader,
      inMemoryAttachmentsRepository,
    )

    sut = new ImportProblemsFromCsvUseCase(
      inMemoryCategoriesRepository,
      inMemoryLocationsRepository,
      inMemoryProblemsRepository,
      createProblemUseCase,
      uploadAttachmentUseCase,
    )

    mockLookupAll([{ address: '93.184.216.34', family: 4 }])
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('should import valid rows and skip duplicates inside the same file', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Bloco A - Sala 201', code: 'BLA-201' },
        new UniqueEntityID('location-id'),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Bloco A - Sala 201',
          locationCode: 'BLA-201',
        },
        {
          rowNumber: 3,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Bloco A - Sala 201',
          locationCode: 'BLA-201',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(1)
    expect(result.value.duplicates).toBe(1)
    expect(result.value.invalid).toBe(0)
    expect(result.value.results).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        status: 'IMPORTED',
      }),
      expect.objectContaining({
        rowNumber: 3,
        status: 'DUPLICATE',
      }),
    ])
  })

  it('should report invalid rows when data does not match current rules', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Bloco A - Sala 201', code: 'BLA-201' },
        new UniqueEntityID('location-id'),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: '',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Bloco A - Sala 201',
        },
        {
          rowNumber: 3,
          title: 'Problema válido',
          description: 'Descrição válida',
          category: 'Categoria ausente',
          locationName: 'Bloco A - Sala 201',
        },
        {
          rowNumber: 4,
          title: 'Outro problema',
          description: 'Descrição válida',
          category: 'Climatização',
          locationName: 'Local inexistente',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(0)
    expect(result.value.duplicates).toBe(0)
    expect(result.value.invalid).toBe(3)
    expect(
      result.value.results.every((item) => item.status === 'INVALID'),
    ).toBe(true)
  })

  it('should skip rows that already exist in the database', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Bloco A - Sala 201', code: 'BLA-201' },
        new UniqueEntityID('location-id'),
      ),
    )

    await createProblemUseCase.execute({
      reporterId: 'existing-reporter',
      title: 'Ar-condicionado sem funcionar',
      description: 'Equipamento não liga.',
      attachmentsIds: [],
      categoryId: 'category-id',
      locationId: 'location-id',
    })

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Bloco A - Sala 201',
          locationCode: 'BLA-201',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(0)
    expect(result.value.duplicates).toBe(1)
    expect(result.value.invalid).toBe(0)
    expect(result.value.results[0]).toEqual(
      expect.objectContaining({
        rowNumber: 2,
        status: 'DUPLICATE',
      }),
    )
  })

  it('should match categories and locations ignoring accents, casing and extra spaces', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Bloco A - Sala 201', code: 'BLA-201' },
        new UniqueEntityID('location-id'),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: '  CLIMATIZACAO  ',
          locationName: '  bloco a -  sala 201  ',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(1)
    expect(result.value.duplicates).toBe(0)
    expect(result.value.invalid).toBe(0)
    expect(result.value.results[0]).toEqual(
      expect.objectContaining({
        rowNumber: 2,
        status: 'IMPORTED',
      }),
    )
  })

  it('should import using split location name and code columns', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório de Informática', code: 'LAB-01' },
        new UniqueEntityID('location-id'),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório de Informática',
          locationCode: 'LAB-01',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(1)
    expect(result.value.duplicates).toBe(0)
    expect(result.value.invalid).toBe(0)
  })

  it('should import using only location name when it is unique', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório de Informática', code: 'LAB-01' },
        new UniqueEntityID('location-id'),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório de Informática',
          locationCode: '',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(1)
    expect(result.value.duplicates).toBe(0)
    expect(result.value.invalid).toBe(0)
  })

  it('should reject ambiguous location names when code is not informed', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório', code: 'LAB-01' },
        new UniqueEntityID('location-1'),
      ),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório', code: 'LAB-02' },
        new UniqueEntityID('location-2'),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(0)
    expect(result.value.duplicates).toBe(0)
    expect(result.value.invalid).toBe(1)
    expect(result.value.results[0]).toEqual(
      expect.objectContaining({
        rowNumber: 2,
        status: 'INVALID',
        message: expect.stringContaining('ambígua'),
      }),
    )
  })

  it('should upload and link an attachment when imageUrl is informed', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório de Informática', code: 'LAB-01' },
        new UniqueEntityID('location-id'),
      ),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(Buffer.from('fake image'), {
          status: 200,
          headers: {
            'content-type': 'image/png',
            'content-length': '10',
          },
        }),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório de Informática',
          locationCode: 'LAB-01',
          imageUrl: 'https://example.com/uploads/problema.png',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(1)
    expect(fakeUploader.uploads).toHaveLength(1)
    expect(fakeUploader.uploads[0].fileName).toBe('problema.png')
    expect(inMemoryAttachmentsRepository.items).toHaveLength(1)
    expect(inMemoryProblemAttachmentLinksStore.items).toHaveLength(1)
    expect(
      inMemoryProblemAttachmentLinksStore.items[0].attachmentId.toValue(),
    ).toBe(inMemoryAttachmentsRepository.items[0].id.toValue())
  })

  it('should mark the row as invalid when image download fails', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório de Informática', code: 'LAB-01' },
        new UniqueEntityID('location-id'),
      ),
    )

    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('network error')),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório de Informática',
          locationCode: 'LAB-01',
          imageUrl: 'https://example.com/uploads/problema.png',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(0)
    expect(result.value.invalid).toBe(1)
    expect(result.value.results[0]).toEqual(
      expect.objectContaining({
        rowNumber: 2,
        status: 'INVALID',
        message: expect.stringContaining('baixar a imagem'),
      }),
    )
    expect(fakeUploader.uploads).toHaveLength(0)
    expect(inMemoryProblemsRepository.items).toHaveLength(0)
  })

  it('should not upload image when the problem already exists in the database', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório de Informática', code: 'LAB-01' },
        new UniqueEntityID('location-id'),
      ),
    )

    await createProblemUseCase.execute({
      reporterId: 'existing-reporter',
      title: 'Ar-condicionado sem funcionar',
      description: 'Equipamento não liga.',
      attachmentsIds: [],
      categoryId: 'category-id',
      locationId: 'location-id',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(Buffer.from('fake image'), {
          status: 200,
          headers: {
            'content-type': 'image/png',
            'content-length': '10',
          },
        }),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório de Informática',
          locationCode: 'LAB-01',
          imageUrl: 'https://example.com/uploads/problema.png',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(0)
    expect(result.value.duplicates).toBe(1)
    expect(fakeUploader.uploads).toHaveLength(0)
    expect(inMemoryAttachmentsRepository.items).toHaveLength(0)
  })

  it('should reject image URLs that resolve to blocked internal addresses', async () => {
    inMemoryCategoriesRepository.items.push(
      makeCategory({ name: 'Climatização' }, new UniqueEntityID('category-id')),
    )
    inMemoryLocationsRepository.items.push(
      makeLocation(
        { name: 'Laboratório de Informática', code: 'LAB-01' },
        new UniqueEntityID('location-id'),
      ),
    )

    mockLookupAll([{ address: '127.0.0.1', family: 4 }])
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(Buffer.from('fake image'), {
          status: 200,
          headers: {
            'content-type': 'image/png',
            'content-length': '10',
          },
        }),
      ),
    )

    const result = await sut.execute({
      reporterId: 'reporter-1',
      rows: [
        {
          rowNumber: 2,
          title: 'Ar-condicionado sem funcionar',
          description: 'Equipamento não liga.',
          category: 'Climatização',
          locationName: 'Laboratório de Informática',
          locationCode: 'LAB-01',
          imageUrl: 'https://internal.example/problema.png',
        },
      ],
    })

    expect(result.isRight()).toBe(true)
    expect(result.value.imported).toBe(0)
    expect(result.value.invalid).toBe(1)
    expect(result.value.results[0]).toEqual(
      expect.objectContaining({
        rowNumber: 2,
        status: 'INVALID',
        message: expect.stringContaining('destino não permitido'),
      }),
    )
    expect(global.fetch).not.toHaveBeenCalled()
    expect(fakeUploader.uploads).toHaveLength(0)
  })
})
