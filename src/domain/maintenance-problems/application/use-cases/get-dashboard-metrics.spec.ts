import { GetDashboardMetricsUseCase } from './get-dashboard-metrics'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { InMemoryProblemAttachmentLinksStore } from 'test/repositories/in-memory-problem-attachment-links-store'
import { ProblemStatus } from '../../enterprise/entities/problems/problem'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentLinksStore: InMemoryProblemAttachmentLinksStore
let sut: GetDashboardMetricsUseCase

describe('Get Dashboard Metrics', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentLinksStore =
      new InMemoryProblemAttachmentLinksStore()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentLinksStore,
    )
    sut = new GetDashboardMetricsUseCase(inMemoryProblemsRepository)
  })

  it('should return dashboard metrics with correct total count', async () => {
    // Create 5 problems
    for (let i = 0; i < 5; i++) {
      await inMemoryProblemsRepository.create(
        makeProblem({
          reporterId: new UniqueEntityID('reporter-1'),
          status: ProblemStatus.TO_ANALYSIS,
        }),
      )
    }

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.metrics.totalProblems).toBe(5)
    }
  })

  it('should count problems by status correctly', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      }),
    )

    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      }),
    )

    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_PROGRESS,
      }),
    )

    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.FINISHED,
      }),
    )

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      const metrics = result.value.metrics
      expect(metrics.toAnalysisCount).toBe(2)
      expect(metrics.inProgressCount).toBe(1)
      expect(metrics.finishedCount).toBe(1)
    }
  })

  it('should not count deleted problems', async () => {
    // Create 3 active problems
    for (let i = 0; i < 3; i++) {
      await inMemoryProblemsRepository.create(
        makeProblem({
          reporterId: new UniqueEntityID('reporter-1'),
          status: ProblemStatus.TO_ANALYSIS,
        }),
      )
    }

    // Create 2 deleted problems
    for (let i = 0; i < 2; i++) {
      const problem = makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      })
      problem.moveToTrash()
      await inMemoryProblemsRepository.create(problem)
    }

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.metrics.totalProblems).toBe(3)
    }
  })

  it('should count recent problems (last 7 days)', async () => {
    const now = new Date()
    const tenDaysAgo = new Date()
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)

    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)

    // Create old problem (10 days ago)
    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
        createdAt: tenDaysAgo,
      }),
    )

    // Create recent problems (5 days ago and now)
    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
        createdAt: fiveDaysAgo,
      }),
    )

    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
        createdAt: now,
      }),
    )

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.metrics.totalProblems).toBe(3)
      expect(result.value.metrics.recentProblems).toBe(2)
    }
  })

  it('should calculate average resolution time for finished problems', async () => {
    const createdAt = new Date('2025-01-01')
    const finishedAt5Days = new Date('2025-01-06') // 5 days later
    const finishedAt10Days = new Date('2025-01-11') // 10 days later

    // Problem finished in 5 days
    const problem1 = makeProblem({
      reporterId: new UniqueEntityID('reporter-1'),
      status: ProblemStatus.FINISHED,
      createdAt,
      updatedAt: finishedAt5Days,
    })
    await inMemoryProblemsRepository.create(problem1)

    // Problem finished in 10 days
    const problem2 = makeProblem({
      reporterId: new UniqueEntityID('reporter-1'),
      status: ProblemStatus.FINISHED,
      createdAt,
      updatedAt: finishedAt10Days,
    })
    await inMemoryProblemsRepository.create(problem2)

    // Problem not finished
    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_PROGRESS,
      }),
    )

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      // Average: (5 + 10) / 2 = 7.5 rounded to 8
      expect(result.value.metrics.averageResolutionTime).toBe(8)
    }
  })

  it('should return undefined average resolution time when no finished problems', async () => {
    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      }),
    )

    await inMemoryProblemsRepository.create(
      makeProblem({
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_PROGRESS,
      }),
    )

    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.metrics.averageResolutionTime).toBeUndefined()
    }
  })

  it('should return empty metrics when no problems exist', async () => {
    const result = await sut.execute()

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.metrics.totalProblems).toBe(0)
      expect(result.value.metrics.recentProblems).toBe(0)
      expect(result.value.metrics.problemsByStatus).toEqual([])
      expect(result.value.metrics.averageResolutionTime).toBeUndefined()
    }
  })
})
