import { EditCategoryUseCase } from './edit-category'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CategoryInTrashError } from '@/core/errors/category-in-trash-error'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: EditCategoryUseCase

describe('Edit Category', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new EditCategoryUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to edit a category', async () => {
    const category = makeCategory(
      {
        name: 'Categoria Original',
        description: 'Descricao original',
      },
      new UniqueEntityID('category-1'),
    )

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.MANAGER,
      name: 'Categoria Editada',
      description: 'Descricao editada',
      isActive: false,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items[0]).toMatchObject({
      name: 'Categoria Editada',
      description: 'Descricao editada',
      isActive: false,
    })
  })

  it('should not be able to edit a non-existing category', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-id',
      userRole: UserRole.MANAGER,
      name: 'Categoria Editada',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to edit a category in trash', async () => {
    const category = makeCategory(
      {
        name: 'Categoria na Lixeira',
      },
      new UniqueEntityID('category-1'),
    )

    category.moveToTrash()

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
      userRole: UserRole.MANAGER,
      name: 'Categoria Editada',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CategoryInTrashError)
  })
})
