import { MoveProblemToTrashUseCase } from './move-problem-to-trash'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import { ProblemStatus } from '../../enterprise/entities/problems/problem'
import { ProblemNotDeletableError } from '@/core/errors/problem-not-deletable-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let sut: MoveProblemToTrashUseCase

describe('Move Problem To Trash', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    sut = new MoveProblemToTrashUseCase(inMemoryProblemsRepository)
  })

  it('should be able to move problem to trash when status is TO_ANALYSIS', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryProblemsRepository.items[0].isDeleted).toBe(true)
    expect(inMemoryProblemsRepository.items[0].deletedAt).toBeInstanceOf(Date)
  })

  it('should not be able to move problem to trash from another user', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to move problem to trash when status is not TO_ANALYSIS', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProblemNotDeletableError)
  })

  it('should not be able to move problem to trash when status is ACCEPTED', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.ACCEPTED,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProblemNotDeletableError)
  })

  it('should not be able to move problem to trash when status is IN_PROGRESS', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        status: ProblemStatus.IN_PROGRESS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProblemNotDeletableError)
  })

  it('should return error when problem does not exist', async () => {
    const result = await sut.execute({
      problemId: 'non-existent-id',
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not list deleted problems in findMany', async () => {
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

    await inMemoryProblemsRepository.create(problem1)
    await inMemoryProblemsRepository.create(problem2)

    // Move problem 1 to trash
    await sut.execute({
      problemId: problem1.id.toValue(),
      reporterId: 'reporter-1',
    })

    const { items: problems } = await inMemoryProblemsRepository.findMany({
      page: 1,
    })

    expect(problems).toHaveLength(1)
    expect(problems[0].id.toValue()).toBe('problem-2')
  })
})
