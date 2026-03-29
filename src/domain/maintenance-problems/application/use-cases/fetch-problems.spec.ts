import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { FetchProblemsUseCase } from './fetch-problems'
import { InMemoryProblemAttachmentLinksStore } from 'test/repositories/in-memory-problem-attachment-links-store'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ProblemStatus } from '@/domain/maintenance-problems/enterprise/entities/problems/problem'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentLinksStore: InMemoryProblemAttachmentLinksStore
let sut: FetchProblemsUseCase

describe('Fetch Recent Problems', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentLinksStore =
      new InMemoryProblemAttachmentLinksStore()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentLinksStore,
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

  it('should keep status as the primary listing order', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Mais novo, mas recusado',
        status: ProblemStatus.REJECTED,
        createdAt: new Date(2022, 0, 23, 10, 0, 0),
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Mais antigo, mas para análise',
        status: ProblemStatus.TO_ANALYSIS,
        createdAt: new Date(2022, 0, 22, 10, 0, 0),
      }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.problems).toEqual([
      expect.objectContaining({ title: 'Mais antigo, mas para análise' }),
      expect.objectContaining({ title: 'Mais novo, mas recusado' }),
    ])
  })

  it('should use creation date as a tie-breaker when status is the same', async () => {
    const createdAt = new Date(2022, 0, 23, 10, 0, 0)

    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Recusado',
        status: ProblemStatus.REJECTED,
        createdAt,
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Em andamento',
        status: ProblemStatus.IN_PROGRESS,
        createdAt,
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Para análise',
        status: ProblemStatus.TO_ANALYSIS,
        createdAt,
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Concluído',
        status: ProblemStatus.FINISHED,
        createdAt,
      }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.problems.map((problem) => problem.title)).toEqual([
      'Para análise',
      'Recusado',
      'Em andamento',
      'Concluído',
    ])
  })

  it('should keep newer problems first inside the same status', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Aceito mais antigo',
        status: ProblemStatus.ACCEPTED,
        createdAt: new Date(2022, 0, 22, 10, 0, 0),
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Aceito mais novo',
        status: ProblemStatus.ACCEPTED,
        createdAt: new Date(2022, 0, 23, 10, 0, 0),
      }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.problems).toEqual([
      expect.objectContaining({ title: 'Aceito mais novo' }),
      expect.objectContaining({ title: 'Aceito mais antigo' }),
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
    expect(result.value?.total).toBe(22)
  })

  it('should respect a custom page size when fetching problems', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryProblemsRepository.create(makeProblem())
    }

    const result = await sut.execute({
      page: 2,
      pageSize: 10,
    })

    expect(result.value?.problems).toHaveLength(10)
    expect(result.value?.total).toBe(22)
  })

  it('should filter problems by query in title', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Water Leak Problem',
        createdAt: new Date(2022, 0, 20),
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Electrical Issue',
        createdAt: new Date(2022, 0, 21),
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Water Pressure Low',
        createdAt: new Date(2022, 0, 22),
      }),
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

  it('should filter problems by statuses', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Problem A',
        status: ProblemStatus.TO_ANALYSIS,
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Problem B',
        status: ProblemStatus.IN_PROGRESS,
      }),
    )
    await inMemoryProblemsRepository.create(
      makeProblem({
        title: 'Problem C',
        status: ProblemStatus.FINISHED,
      }),
    )

    const result = await sut.execute({
      page: 1,
      statuses: [ProblemStatus.IN_PROGRESS, ProblemStatus.FINISHED],
    })

    expect(result.value?.problems).toHaveLength(2)
    expect(result.value?.total).toBe(2)
    expect(result.value?.problems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Problem B' }),
        expect.objectContaining({ title: 'Problem C' }),
      ]),
    )
  })

  it('should return all problems when no query is provided', async () => {
    await inMemoryProblemsRepository.create(makeProblem({ title: 'Problem 1' }))
    await inMemoryProblemsRepository.create(makeProblem({ title: 'Problem 2' }))
    await inMemoryProblemsRepository.create(makeProblem({ title: 'Problem 3' }))

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.problems).toHaveLength(3)
  })

  it('should fetch only the current reporter deleted problems when reporterId is provided', async () => {
    const reporterId = '8a9f2b68-1f5d-4f46-a6dd-531a6f9b1111'
    const otherReporterId = 'd2f32f2b-1f04-4552-8a85-2f7fdc2b2222'

    const ownDeletedProblem = makeProblem({
      title: 'Own deleted problem',
      reporterId: new UniqueEntityID(reporterId),
    })
    ownDeletedProblem.moveToTrash()

    const otherDeletedProblem = makeProblem({
      title: 'Other deleted problem',
      reporterId: new UniqueEntityID(otherReporterId),
    })
    otherDeletedProblem.moveToTrash()

    const ownActiveProblem = makeProblem({
      title: 'Own active problem',
      reporterId: new UniqueEntityID(reporterId),
    })

    await inMemoryProblemsRepository.create(ownDeletedProblem)
    await inMemoryProblemsRepository.create(otherDeletedProblem)
    await inMemoryProblemsRepository.create(ownActiveProblem)

    const result = await sut.execute({
      page: 1,
      includeDeleted: true,
      reporterId,
    })

    expect(result.value?.problems).toHaveLength(2)
    expect(result.value?.problems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Own deleted problem' }),
        expect.objectContaining({ title: 'Own active problem' }),
      ]),
    )
  })
})
