import { GetProblemBySlugUseCase } from './get-problem-by-slug'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { Slug } from '@/domain/maintenance-problems/enterprise/entities/value-objects/slug'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { makeProblem } from 'test/factories/make-problem'
import { InMemoryProblemAttachmentLinksStore } from 'test/repositories/in-memory-problem-attachment-links-store'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentLinksStore: InMemoryProblemAttachmentLinksStore
let sut: GetProblemBySlugUseCase

describe('Get Problem By Slug', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentLinksStore =
      new InMemoryProblemAttachmentLinksStore()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentLinksStore,
    )
    sut = new GetProblemBySlugUseCase(inMemoryProblemsRepository)
  })

  it('should be able to get a problem by slug', async () => {
    const newProblem = makeProblem({
      reporterId: new UniqueEntityID(),
      title: 'Example Problem',
      slug: Slug.create('example-problem-12345678'),
      description: 'Example description',
    })

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      slug: 'example-problem-12345678',
    })
    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      problem: expect.objectContaining({
        title: newProblem.title,
      }),
    })
  })

  it('should return error when problem with slug does not exist', async () => {
    const result = await sut.execute({
      slug: 'non-existent-slug-12345678',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should return error when problem with slug is in trash', async () => {
    const problem = makeProblem({
      reporterId: new UniqueEntityID(),
      title: 'Deleted problem',
      slug: Slug.create('deleted-problem-12345678'),
      description: 'Deleted description',
    })

    problem.moveToTrash()

    await inMemoryProblemsRepository.create(problem)

    const result = await sut.execute({
      slug: 'deleted-problem-12345678',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to get problem with unique slug containing UUID', async () => {
    const slug1 = Slug.create('problema-teste-a1b2c3d4')
    const slug2 = Slug.create('problema-teste-e5f6g7h8')

    const problem1 = makeProblem({
      reporterId: new UniqueEntityID(),
      title: 'Problema Teste',
      slug: slug1,
      description: 'Primeiro problema',
    })

    const problem2 = makeProblem({
      reporterId: new UniqueEntityID(),
      title: 'Problema Teste',
      slug: slug2,
      description: 'Segundo problema',
    })

    await inMemoryProblemsRepository.create(problem1)
    await inMemoryProblemsRepository.create(problem2)

    const result1 = await sut.execute({
      slug: slug1.value,
    })

    const result2 = await sut.execute({
      slug: slug2.value,
    })

    expect(result1.isRight()).toBe(true)
    expect(result2.isRight()).toBe(true)

    if (result1.isRight() && result2.isRight()) {
      expect(result1.value.problem.description).toBe('Primeiro problema')
      expect(result2.value.problem.description).toBe('Segundo problema')
    }
  })
})
