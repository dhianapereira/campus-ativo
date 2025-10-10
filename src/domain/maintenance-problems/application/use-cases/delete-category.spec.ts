import { DeleteCategoryUseCase } from './delete-category'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: DeleteCategoryUseCase

describe('Delete Category', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new DeleteCategoryUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to delete a category as manager', async () => {
    const category = makeCategory(
      {
        name: 'Categoria para Deletar',
      },
      new UniqueEntityID('category-1'),
    )

    await inMemoryCategoriesRepository.create(category)

    expect(inMemoryCategoriesRepository.items).toHaveLength(1)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items).toHaveLength(0)
  })

  it('should be able to delete a category as director', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items).toHaveLength(0)
  })

  it('should be able to delete a category as admin', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items).toHaveLength(0)
  })

  it('should not be able to delete a category as reporter', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryCategoriesRepository.items).toHaveLength(1)
  })

  it('should not be able to delete a non-existing category', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-id',
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
