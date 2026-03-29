import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CreateProblemUseCase } from './create-problem'
import { ImportProblemsFromCsvUseCase } from './import-problems-from-csv'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeLocation } from 'test/factories/make-location'
import { makeCategory } from 'test/factories/make-category'

let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryLocationsRepository: InMemoryLocationsRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let createProblemUseCase: CreateProblemUseCase
let sut: ImportProblemsFromCsvUseCase

describe('Import Problems From CSV', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()

    createProblemUseCase = new CreateProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryLocationsRepository,
      inMemoryCategoriesRepository,
    )

    sut = new ImportProblemsFromCsvUseCase(
      inMemoryCategoriesRepository,
      inMemoryLocationsRepository,
      createProblemUseCase,
    )
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
})
