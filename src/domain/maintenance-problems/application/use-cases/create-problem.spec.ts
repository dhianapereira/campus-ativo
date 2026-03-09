import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CreateProblemUseCase } from './create-problem'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeLocation } from 'test/factories/make-location'
import { makeCategory } from 'test/factories/make-category'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let inMemoryLocationsRepository: InMemoryLocationsRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: CreateProblemUseCase

describe('Create Problem', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new CreateProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryLocationsRepository,
      inMemoryCategoriesRepository,
    )
  })

  it('should be able to create a problem', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-id'))
    const category = makeCategory({}, new UniqueEntityID('category-id'))
    inMemoryLocationsRepository.items.push(location)
    inMemoryCategoriesRepository.items.push(category)

    const result = await sut.execute({
      reporterId: '1',
      title: 'Novo problema',
      description: 'Descrição do problema',
      attachmentsIds: ['1', '2'],
      locationId: 'location-id',
      categoryId: 'category-id',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0]).toEqual(result.value?.problem)
    expect(inMemoryProblemsRepository.items[0].locationId?.toValue()).toBe(
      location.id.toValue(),
    )
    expect(
      inMemoryProblemsRepository.items[0].attachments.currentItems,
    ).toHaveLength(2)
    expect(
      inMemoryProblemsRepository.items[0].attachments.currentItems,
    ).toEqual([
      expect.objectContaining({ attachmentId: new UniqueEntityID('1') }),
      expect.objectContaining({ attachmentId: new UniqueEntityID('2') }),
    ])
  })

  it('should not create a problem when category does not exist', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-id'))
    inMemoryLocationsRepository.items.push(location)

    const result = await sut.execute({
      reporterId: '1',
      title: 'Novo problema',
      description: 'Descrição do problema',
      attachmentsIds: [],
      locationId: 'location-id',
      categoryId: 'missing-category-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to create a problem without category', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-id'))
    inMemoryLocationsRepository.items.push(location)

    const result = await sut.execute({
      reporterId: '1',
      title: 'Novo problema sem categoria',
      description: 'Descrição do problema',
      attachmentsIds: [],
      locationId: 'location-id',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].categoryId).toBeNull()
  })
})
