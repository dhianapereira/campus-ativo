import { TrashCategoryUseCase } from './trash-category'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: TrashCategoryUseCase

describe('Trash Category', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new TrashCategoryUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to move a category to trash as manager', async () => {
    const category = makeCategory(
      {
        name: 'Categoria para Lixeira',
      },
      new UniqueEntityID('category-1'),
    )

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items[0].deletedAt).toBeTruthy()
    expect(inMemoryCategoriesRepository.items[0].isInTrash).toBe(true)
  })

  it('should not be able to move a category to trash as reporter', async () => {
    const category = makeCategory({}, new UniqueEntityID('category-1'))
    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to move a non-existing category to trash', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-id',
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
