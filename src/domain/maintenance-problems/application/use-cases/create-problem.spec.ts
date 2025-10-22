import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { CreateProblemUseCase } from './create-problem'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { makeLocation } from 'test/factories/make-location'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: CreateProblemUseCase

describe('Create Problem', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    sut = new CreateProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryLocationsRepository,
    )
  })

  it('should be able to create a problem', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-id'))
    inMemoryLocationsRepository.items.push(location)

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
    expect(inMemoryProblemsRepository.items[0].locationName).toBe(location.name)
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
})
