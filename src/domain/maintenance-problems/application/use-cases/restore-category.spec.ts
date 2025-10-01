import { RestoreCategoryUseCase } from './restore-category'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: RestoreCategoryUseCase

describe('Restore Category', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new RestoreCategoryUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to restore a category from trash', async () => {
    const category = makeCategory(
      {
        name: 'Categoria na Lixeira',
      },
      new UniqueEntityID('category-1'),
    )

    category.moveToTrash()

    await inMemoryCategoriesRepository.create(category)

    expect(inMemoryCategoriesRepository.items[0].isInTrash).toBe(true)

    const result = await sut.execute({
      categoryId: 'category-1',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items[0].deletedAt).toBeNull()
    expect(inMemoryCategoriesRepository.items[0].isInTrash).toBe(false)
  })

  it('should not be able to restore a non-existing category', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
