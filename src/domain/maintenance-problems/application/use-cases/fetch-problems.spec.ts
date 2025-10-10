import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { FetchProblemsUseCase } from './fetch-problems'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let sut: FetchProblemsUseCase

describe('Fetch Recent Problems', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    sut = new FetchProblemsUseCase(inMemoryProblemsRepository)
  })

  it('should be able to fetch recent problems', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({ createdAt: new Date(2022, 0, 20) }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({ createdAt: new Date(2022, 0, 18) }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({ createdAt: new Date(2022, 0, 23) }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.problems).toEqual([
      expect.objectContaining({ createdAt: new Date(2022, 0, 23) }),
      expect.objectContaining({ createdAt: new Date(2022, 0, 20) }),
      expect.objectContaining({ createdAt: new Date(2022, 0, 18) }),
    ])
  })

  it('should be able to fetch paginated recent problems', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryProblemsRepository.create(makeProblem())
    }

    const result = await sut.execute({
      page: 2,
    })

    expect(result.value?.problems).toHaveLength(2)
  })

  it('should filter problems by query in title', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({ title: 'Water Leak Problem', createdAt: new Date(2022, 0, 20) }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({ title: 'Electrical Issue', createdAt: new Date(2022, 0, 21) }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({ title: 'Water Pressure Low', createdAt: new Date(2022, 0, 22) }),
    )

    const result = await sut.execute({
      page: 1,
      query: 'water',
    })

    expect(result.value?.problems).toHaveLength(2)
    expect(result.value?.problems).toEqual([
      expect.objectContaining({ title: 'Water Pressure Low' }),
      expect.objectContaining({ title: 'Water Leak Problem' }),
    ])
  })

  it('should filter problems by query in description', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Problem A',
        description: 'The water system needs urgent repair',
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Problem B',
        description: 'The electrical wiring is damaged',
      }),
    )

    const result = await sut.execute({
      page: 1,
      query: 'electrical',
    })

    expect(result.value?.problems).toHaveLength(1)
    expect(result.value?.problems[0].title).toBe('Problem B')
  })

  it('should return all problems when no query is provided', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({ title: 'Problem 1' }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({ title: 'Problem 2' }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({ title: 'Problem 3' }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.problems).toHaveLength(3)
  })
})
