import { EditProblemUseCase } from './edit-problem'
import { InMemoryProblemsRepository } from 'test/repositories/in-memory-problems-repository'
import { makeProblem } from 'test/factories/make-problem'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { InMemoryProblemAttachmentsRepository } from 'test/repositories/in-memory-problem-attachments-repository'
import { makeProblemAttachment } from 'test/factories/make-problem-attachments'
import { ProblemStatus } from '../../enterprise/entities/problems/problem'
import { ProblemNotEditableError } from '@/core/errors/problem-not-editable-error'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { makeCategory } from 'test/factories/make-category'
import { makeLocation } from 'test/factories/make-location'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryProblemsRepository: InMemoryProblemsRepository
let inMemoryProblemAttachmentsRepository: InMemoryProblemAttachmentsRepository
let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: EditProblemUseCase

describe('Edit Problem', () => {
  beforeEach(() => {
    inMemoryProblemAttachmentsRepository =
      new InMemoryProblemAttachmentsRepository()
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    inMemoryProblemsRepository = new InMemoryProblemsRepository(
      inMemoryProblemAttachmentsRepository,
    )
    sut = new EditProblemUseCase(
      inMemoryProblemsRepository,
      inMemoryProblemAttachmentsRepository,
      inMemoryLocationsRepository,
      inMemoryCategoriesRepository,
    )
  })

  it('should be able to edit a problem when status is TO_ANALYSIS', async () => {
    const previousCategory = makeCategory({}, new UniqueEntityID('category-1'))
    const newCategory = makeCategory({}, new UniqueEntityID('category-2'))
    const previousLocation = makeLocation({}, new UniqueEntityID('location-1'))
    const newLocation = makeLocation({}, new UniqueEntityID('location-2'))

    await inMemoryCategoriesRepository.create(previousCategory)
    await inMemoryCategoriesRepository.create(newCategory)
    await inMemoryLocationsRepository.create(previousLocation)
    await inMemoryLocationsRepository.create(newLocation)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: previousCategory.id,
        locationId: previousLocation.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)
    inMemoryProblemAttachmentsRepository.items.push(
      makeProblemAttachment({
        problemId: newProblem.id,
        attachmentId: new UniqueEntityID('1'),
      }),
      makeProblemAttachment({
        problemId: newProblem.id,
        attachmentId: new UniqueEntityID('2'),
      }),
    )

    await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: 'category-2',
      locationId: 'location-2',
      attachmentsIds: ['1', '3'],
    })

    expect(inMemoryProblemsRepository.items[0]).toMatchObject({
      title: 'Problema teste',
      description: 'Descrição teste',
    })
    expect(inMemoryProblemsRepository.items[0].categoryId.toValue()).toBe(
      newCategory.id.toValue(),
    )
    expect(inMemoryProblemsRepository.items[0].locationId.toValue()).toBe(
      newLocation.id.toValue(),
    )
    expect(
      inMemoryProblemsRepository.items[0].attachments.currentItems,
    ).toHaveLength(2)
    expect(
      inMemoryProblemsRepository.items[0].attachments.currentItems,
    ).toEqual([
      expect.objectContaining({ attachmentId: new UniqueEntityID('1') }),
      expect.objectContaining({ attachmentId: new UniqueEntityID('3') }),
    ])
  })

  it('should not be able to edit a problem from another user', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-2',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: category.id.toValue(),
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to edit a problem when status is not TO_ANALYSIS', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.IN_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: category.id.toValue(),
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProblemNotEditableError)
  })

  it('should not be able to edit a problem when status is ACCEPTED', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.ACCEPTED,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: category.id.toValue(),
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProblemNotEditableError)
  })

  it('should not be able to edit a problem when status is IN_PROGRESS', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.IN_PROGRESS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: category.id.toValue(),
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ProblemNotEditableError)
  })

  it('should not be able to edit a problem with an invalid category', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: 'missing-category',
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit a problem with a deleted category', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const deletedCategory = makeCategory({}, new UniqueEntityID('category-2'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))
    deletedCategory.moveToTrash()

    await inMemoryCategoriesRepository.create(category)
    await inMemoryCategoriesRepository.create(deletedCategory)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: deletedCategory.id.toValue(),
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to keep the current deleted category', async () => {
    const deletedCategory = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))
    deletedCategory.moveToTrash()

    await inMemoryCategoriesRepository.create(deletedCategory)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: deletedCategory.id,
        locationId: location.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste atualizado',
      description: 'Descrição teste atualizada',
      categoryId: deletedCategory.id.toValue(),
      locationId: location.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isRight()).toBe(true)
  })

  it('should not be able to edit a problem with an invalid location', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: category.id.toValue(),
      locationId: 'missing-location',
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit a problem with a deleted location', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const location = makeLocation({}, new UniqueEntityID('location-1'))
    const deletedLocation = makeLocation({}, new UniqueEntityID('location-2'))
    deletedLocation.moveToTrash()

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(location)
    await inMemoryLocationsRepository.create(deletedLocation)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: location.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste',
      description: 'Descrição teste',
      categoryId: category.id.toValue(),
      locationId: deletedLocation.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to keep the current deleted location', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    const deletedLocation = makeLocation({}, new UniqueEntityID('location-1'))
    deletedLocation.moveToTrash()

    await inMemoryCategoriesRepository.create(category)
    await inMemoryLocationsRepository.create(deletedLocation)

    const newProblem = makeProblem(
      {
        reporterId: new UniqueEntityID('reporter-1'),
        categoryId: category.id,
        locationId: deletedLocation.id,
        status: ProblemStatus.TO_ANALYSIS,
      },
      new UniqueEntityID('problem-1'),
    )

    await inMemoryProblemsRepository.create(newProblem)

    const result = await sut.execute({
      problemId: newProblem.id.toValue(),
      reporterId: 'reporter-1',
      title: 'Problema teste atualizado',
      description: 'Descrição teste atualizada',
      categoryId: category.id.toValue(),
      locationId: deletedLocation.id.toValue(),
      attachmentsIds: [],
    })

    expect(result.isRight()).toBe(true)
  })
})
