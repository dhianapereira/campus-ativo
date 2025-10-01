import { DeleteCategoryUseCase } from './delete-category'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: DeleteCategoryUseCase

describe('Delete Category', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new DeleteCategoryUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to delete a category', async () => {
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
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items).toHaveLength(0)
  })

  it('should not be able to delete a non-existing category', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
