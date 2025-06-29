import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { FetchCategoriesUseCase } from './fetch-categories'
import { makeCategory } from 'test/factories/make-category'

let inMemoryCategoriesRepository: InMemoryCategoriesRepository
let sut: FetchCategoriesUseCase

describe('Fetch Recent Categories', () => {
  beforeEach(() => {
    inMemoryCategoriesRepository = new InMemoryCategoriesRepository()
    sut = new FetchCategoriesUseCase(inMemoryCategoriesRepository)
  })

  it('should be able to fetch recent categories', async () => {
    await inMemoryCategoriesRepository.create(
      makeCategory({ createdAt: new Date(2022, 0, 20) }),
    )
    await inMemoryCategoriesRepository.create(
      makeCategory({ createdAt: new Date(2022, 0, 18) }),
    )
    await inMemoryCategoriesRepository.create(
      makeCategory({ createdAt: new Date(2022, 0, 23) }),
    )

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.categories).toEqual([
      expect.objectContaining({ createdAt: new Date(2022, 0, 23) }),
      expect.objectContaining({ createdAt: new Date(2022, 0, 20) }),
      expect.objectContaining({ createdAt: new Date(2022, 0, 18) }),
    ])
  })

  it('should be able to fetch paginated recent categories', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryCategoriesRepository.create(makeCategory())
    }

    const result = await sut.execute({
      page: 2,
    })

    expect(result.value?.categories).toHaveLength(2)
  })
})
