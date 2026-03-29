import { RestoreProblemFromTrashUseCase } from './restore-problem-from-trash'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { InMemoryProblemAttachmentLinksStore } from 'test/repositories/in-memory-problem-attachment-links-store'
import { ProblemStatus } from '../../enterprise/entities/problems/problem'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentLinksStore: InMemoryProblemAttachmentLinksStore
let sut: RestoreProblemFromTrashUseCase

describe('Restore Problem From Trash', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentLinksStore =
      new InMemoryProblemAttachmentLinksStore()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentLinksStore,
    )
    sut = new RestoreProblemFromTrashUseCase(inMemoryProblemsRepository)
  })

  it('should be able to restore problem from trash', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    // Move to trash first
    newProblem.moveToTrash()
    await inMemoryProblemsRepository.create(newProblem)

    expect(newProblem.isDeleted).toBe(true)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].isDeleted).toBe(false)
    expect(inMemoryProblemsRepository.items[0].deletedAt).toBe(null)
  })

  it('should not be able to restore problem from another user', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    newProblem.moveToTrash()
    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should return error when problem does not exist', async () => {
    const result = await sut.execute({
      problemId: 'non-existent-id',
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to restore problem that was not deleted', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    expect(newProblem.isDeleted).toBe(false)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].isDeleted).toBe(false)
  })

  it('should list restored problems in findMany', async () => {
    const problem1 = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
        title: 'Problem 1',
      },
      new UniqueEntityID('problem-1'),
    )

    const problem2 = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-2'),
        status: ProblemStatus.TO_ANALYSIS,
        title: 'Problem 2',
      },
      new UniqueEntityID('problem-2'),
    )

    // Move both to trash
    problem1.moveToTrash()
    problem2.moveToTrash()

    await inMemoryProblemsRepository.create(problem1)
    await inMemoryProblemsRepository.create(problem2)

    // Verify they don't appear in list
    let { items: problems } = await inMemoryProblemsRepository.findMany({
      page: 1,
    })
    expect(problems).toHaveLength(0)

    // Restore problem 1
    await sut.execute({
      problemId: problem1.id.toValue(),
      reporterId: 'reporter-1',
    })

    // Now only problem 1 should appear
    ;({ items: problems } = await inMemoryProblemsRepository.findMany({
      page: 1,
    }))

    expect(problems).toHaveLength(1)
    expect(problems[0].id.toValue()).toBe('problem-1')
    expect(problems[0].isDeleted).toBe(false)
  })

  it('should restore problem with any status', async () => {
    const problemInProgress = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_PROGRESS,
      },
      new UniqueEntityID('problem-1'),
    )

    problemInProgress.moveToTrash()
    await inMemoryProblemsRepository.create(problemInProgress)

    const result = await sut.execute({
      problemId: problemInProgress.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].isDeleted).toBe(false)
    expect(inMemoryProblemsRepository.items[0].status).toBe(
      ProblemStatus.IN_PROGRESS,
    )
  })
})
