import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { FetchLocationsUseCase } from './fetch-locations'
import { makeLocation } from 'test/factories/make-location'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { Either } from '@/core/either'

let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: FetchLocationsUseCase

function expectRight<L, R>(result: Either<L, R>): R {
  expect(result.isRight()).toBe(true)

  if (result.isLeft()) {
    throw new Error('Expected a successful result')
  }

  return result.value
}

describe('Fetch Recent Locations', () => {
  beforeEach(() => {
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    sut = new FetchLocationsUseCase(inMemoryLocationsRepository)
  })

  it('should be able to fetch recent locations', async () => {
    await inMemoryLocationsRepository.create(
      makeLocation({ createdAt: new Date(2022, 0, 20) }),
    )
    await inMemoryLocationsRepository.create(
      makeLocation({ createdAt: new Date(2022, 0, 18) }),
    )
    await inMemoryLocationsRepository.create(
      makeLocation({ createdAt: new Date(2022, 0, 23) }),
    )

    const result = await sut.execute({
      page: 1,
    })

    const value = expectRight(result)

    expect(value.locations).toEqual([
      expect.objectContaining({ createdAt: new Date(2022, 0, 23) }),
      expect.objectContaining({ createdAt: new Date(2022, 0, 20) }),
      expect.objectContaining({ createdAt: new Date(2022, 0, 18) }),
    ])
  })

  it('should be able to fetch paginated recent locations', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryLocationsRepository.create(makeLocation())
    }

    const result = await sut.execute({
      page: 2,
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(2)
    expect(value.total).toBe(22)
  })

  it('should respect a custom page size when fetching locations', async () => {
    for (let i = 1; i <= 22; i++) {
      await inMemoryLocationsRepository.create(makeLocation())
    }

    const result = await sut.execute({
      page: 2,
      pageSize: 10,
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(10)
    expect(value.total).toBe(22)
  })

  it('should not fetch deleted locations by default', async () => {
    const location1 = makeLocation({ name: 'Active Location' })
    const location2 = makeLocation({ name: 'Deleted Location' })

    await inMemoryLocationsRepository.create(location1)
    await inMemoryLocationsRepository.create(location2)

    location2.moveToTrash()
    await inMemoryLocationsRepository.save(location2)

    const result = await sut.execute({
      page: 1,
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(1)
    expect(value.locations[0].name).toBe('Active Location')
  })

  it('should fetch deleted locations when includeDeleted is true', async () => {
    const location1 = makeLocation({ name: 'Active Location' })
    const location2 = makeLocation({ name: 'Deleted Location' })

    await inMemoryLocationsRepository.create(location1)
    await inMemoryLocationsRepository.create(location2)

    location2.moveToTrash()
    await inMemoryLocationsRepository.save(location2)

    const result = await sut.execute({
      page: 1,
      includeDeleted: true,
      userRole: UserRole.MANAGER,
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(2)
  })

  it('should not allow reporter to fetch deleted locations', async () => {
    const location = makeLocation({ name: 'Deleted Location' })

    await inMemoryLocationsRepository.create(location)

    location.moveToTrash()
    await inMemoryLocationsRepository.save(location)

    const result = await sut.execute({
      page: 1,
      includeDeleted: true,
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should filter locations by isActive', async () => {
    await inMemoryLocationsRepository.create(
      makeLocation({ name: 'Active Location', isActive: true }),
    )
    await inMemoryLocationsRepository.create(
      makeLocation({ name: 'Inactive Location', isActive: false }),
    )

    const resultActive = await sut.execute({
      page: 1,
      isActive: true,
    })

    const activeValue = expectRight(resultActive)

    expect(activeValue.locations).toHaveLength(1)
    expect(activeValue.locations[0].name).toBe('Active Location')

    const resultInactive = await sut.execute({
      page: 1,
      isActive: false,
    })

    const inactiveValue = expectRight(resultInactive)

    expect(inactiveValue.locations).toHaveLength(1)
    expect(inactiveValue.locations[0].name).toBe('Inactive Location')
  })

  it('should filter locations by query in name', async () => {
    await inMemoryLocationsRepository.create(
      makeLocation({ name: 'Building A', createdAt: new Date(2022, 0, 20) }),
    )
    await inMemoryLocationsRepository.create(
      makeLocation({ name: 'Building B', createdAt: new Date(2022, 0, 21) }),
    )
    await inMemoryLocationsRepository.create(
      makeLocation({ name: 'Auditorium', createdAt: new Date(2022, 0, 22) }),
    )

    const result = await sut.execute({
      page: 1,
      query: 'building',
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(2)
    expect(value.locations).toEqual([
      expect.objectContaining({ name: 'Building B' }),
      expect.objectContaining({ name: 'Building A' }),
    ])
  })

  it('should filter locations by query in description', async () => {
    await inMemoryLocationsRepository.create(
      makeLocation({
        name: 'Location A',
        description: 'This is the main building',
      }),
    )
    await inMemoryLocationsRepository.create(
      makeLocation({
        name: 'Location B',
        description: 'This is the auditorium',
      }),
    )

    const result = await sut.execute({
      page: 1,
      query: 'auditorium',
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(1)
    expect(value.locations[0].name).toBe('Location B')
  })

  it('should combine multiple filters', async () => {
    const location1 = makeLocation({
      name: 'Active Building',
      isActive: true,
    })
    const location2 = makeLocation({
      name: 'Inactive Building',
      isActive: false,
    })
    const location3 = makeLocation({
      name: 'Active Auditorium',
      isActive: true,
    })

    await inMemoryLocationsRepository.create(location1)
    await inMemoryLocationsRepository.create(location2)
    await inMemoryLocationsRepository.create(location3)

    const result = await sut.execute({
      page: 1,
      query: 'building',
      isActive: true,
    })

    const value = expectRight(result)

    expect(value.locations).toHaveLength(1)
    expect(value.locations[0].name).toBe('Active Building')
  })
})
