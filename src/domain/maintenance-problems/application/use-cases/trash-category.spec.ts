import { TrashCategoryUseCase } from './trash-category'
import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { makeCategory } from 'test/factories/make-category'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: TrashCategoryUseCase

describe('Trash Category', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new TrashCategoryUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to move a category to trash', async () => {
    const category = makeCategory(
      {
        name: 'Categoria para Lixeira',
      },
      new UniqueEntityID('category-1'),
    )

    await inMemoryCategoriesRepository.create(category)

    const result = await sut.execute({
      categoryId: 'category-1',
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryCategoriesRepository.items[0].deletedAt).toBeTruthy()
    expect(inMemoryCategoriesRepository.items[0].isInTrash).toBe(true)
  })

  it('should not be able to move a non-existing category to trash', async () => {
    const result = await sut.execute({
      categoryId: 'non-existing-id',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
