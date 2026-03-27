import { InMemoryCategoriesRepository } from 'test/repositories/in-memory-categories-repository'
import { FetchCategoriesUseCase } from './fetch-categories'
import { makeCategory } from 'test/factories/make-category'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'

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
    expect(result.value?.total).toBe(22)
  })

  it('should respect a custom page size when fetching categories', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryCategoriesRepository.create(makeCategory())
    }

    const result = await sut.execute({
      page: 2,
      pageSize: 10,
    })

    expect(result.value?.categories).toHaveLength(10)
    expect(result.value?.total).toBe(22)
  })

  it('should not fetch deleted categories by default', async () => {
    const category1 = makeCategory({ name: 'Active Category' })
    const category2 = makeCategory({ name: 'Deleted Category' })

    await inMemoryCategoriesRepository.create(category1)
    await inMemoryCategoriesRepository.create(category2)

    category2.moveToTrash()
    await inMemoryCategoriesRepository.save(category2)

    const result = await sut.execute({
      page: 1,
    })

    expect(result.value?.categories).toHaveLength(1)
    expect(result.value?.categories[0].name).toBe('Active Category')
  })

  it('should fetch deleted categories when includeDeleted is true', async () => {
    const category1 = makeCategory({ name: 'Active Category' })
    const category2 = makeCategory({ name: 'Deleted Category' })

    await inMemoryCategoriesRepository.create(category1)
    await inMemoryCategoriesRepository.create(category2)

    category2.moveToTrash()
    await inMemoryCategoriesRepository.save(category2)

    const result = await sut.execute({
      page: 1,
      includeDeleted: true,
      userRole: UserRole.MANAGER,
    })

    expect(result.value?.categories).toHaveLength(2)
  })

  it('should not allow reporter to fetch deleted categories', async () => {
    const category = makeCategory({ name: 'Deleted Category' })

    await inMemoryCategoriesRepository.create(category)

    category.moveToTrash()
    await inMemoryCategoriesRepository.save(category)

    const result = await sut.execute({
      page: 1,
      includeDeleted: true,
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should filter categories by isActive', async () => {
    await inMemoryCategoriesRepository.create(
      makeCategory({ name: 'Active Category', isActive: true }),
    )
    await inMemoryCategoriesRepository.create(
      makeCategory({ name: 'Inactive Category', isActive: false }),
    )

    const resultActive = await sut.execute({
      page: 1,
      isActive: true,
    })

    expect(resultActive.value?.categories).toHaveLength(1)
    expect(resultActive.value?.categories[0].name).toBe('Active Category')

    const resultInactive = await sut.execute({
      page: 1,
      isActive: false,
    })

    expect(resultInactive.value?.categories).toHaveLength(1)
    expect(resultInactive.value?.categories[0].name).toBe('Inactive Category')
  })

  it('should filter categories by query in name', async () => {
    await inMemoryCategoriesRepository.create(
      makeCategory({ name: 'Electronics', createdAt: new Date(2022, 0, 20) }),
    )
    await inMemoryCategoriesRepository.create(
      makeCategory({ name: 'Furniture', createdAt: new Date(2022, 0, 21) }),
    )
    await inMemoryCategoriesRepository.create(
      makeCategory({
        name: 'Electronic Devices',
        createdAt: new Date(2022, 0, 22),
      }),
    )

    const result = await sut.execute({
      page: 1,
      query: 'electron',
    })

    expect(result.value?.categories).toHaveLength(2)
    expect(result.value?.categories).toEqual([
      expect.objectContaining({ name: 'Electronic Devices' }),
      expect.objectContaining({ name: 'Electronics' }),
    ])
  })

  it('should filter categories by query in description', async () => {
    await inMemoryCategoriesRepository.create(
      makeCategory({
        name: 'Category A',
        description: 'This is about electronics',
      }),
    )
    await inMemoryCategoriesRepository.create(
      makeCategory({
        name: 'Category B',
        description: 'This is about furniture',
      }),
    )

    const result = await sut.execute({
      page: 1,
      query: 'electronics',
    })

    expect(result.value?.categories).toHaveLength(1)
    expect(result.value?.categories[0].name).toBe('Category A')
  })

  it('should combine multiple filters', async () => {
    const category1 = makeCategory({
      name: 'Active Electronics',
      isActive: true,
    })
    const category2 = makeCategory({
      name: 'Inactive Electronics',
      isActive: false,
    })
    const category3 = makeCategory({
      name: 'Active Furniture',
      isActive: true,
    })

    await inMemoryCategoriesRepository.create(category1)
    await inMemoryCategoriesRepository.create(category2)
    await inMemoryCategoriesRepository.create(category3)

    const result = await sut.execute({
      page: 1,
      query: 'electronics',
      isActive: true,
    })

    expect(result.value?.categories).toHaveLength(1)
    expect(result.value?.categories[0].name).toBe('Active Electronics')
  })
})
