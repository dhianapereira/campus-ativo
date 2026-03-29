import { DeleteProblemUseCase } from './delete-problem'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { InMemoryProblemAttachmentLinksStore } from 'test/repositories/in-memory-problem-attachment-links-store'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentLinksStore: InMemoryProblemAttachmentLinksStore
let sut: DeleteProblemUseCase

describe('Delete Problem', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentLinksStore =
      new InMemoryProblemAttachmentLinksStore()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentLinksStore,
    )
    sut = new DeleteProblemUseCase(inMemoryProblemsRepository)
  })

  it('should be able to permanently delete a problem that is in trash', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)
    newProblem.moveToTrash()

    await sut.execute({
      problemId: 'problem-1',
      reporterId: 'reporter-1',
    })

    expect(inMemoryProblemsRepository.items).toHaveLength(1)
    expect(inMemoryProblemsRepository.items[0].purgedAt).toBeInstanceOf(Date)
  })

  it('should not be able to delete a problem from another user', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: 'problem-1',
      reporterId: 'reporter-2',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to permanently delete a problem that is not in trash', async () => {
    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: 'problem-1',
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to permanently delete a non-existing problem', async () => {
    const result = await sut.execute({
      problemId: 'problem-1',
      reporterId: 'reporter-1',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
