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
})
