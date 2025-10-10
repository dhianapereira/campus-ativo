import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { FetchLocationsUseCase } from './fetch-locations'
import { makeLocation } from 'test/factories/make-location'

let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: FetchLocationsUseCase

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

    expect(result.value?.locations).toEqual([
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

    expect(result.value?.locations).toHaveLength(2)
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

    expect(result.value?.locations).toHaveLength(1)
    expect(result.value?.locations[0].name).toBe('Active Location')
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
    })

    expect(result.value?.locations).toHaveLength(2)
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

    expect(resultActive.value?.locations).toHaveLength(1)
    expect(resultActive.value?.locations[0].name).toBe('Active Location')

    const resultInactive = await sut.execute({
      page: 1,
      isActive: false,
    })

    expect(resultInactive.value?.locations).toHaveLength(1)
    expect(resultInactive.value?.locations[0].name).toBe('Inactive Location')
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

    expect(result.value?.locations).toHaveLength(2)
    expect(result.value?.locations).toEqual([
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

    expect(result.value?.locations).toHaveLength(1)
    expect(result.value?.locations[0].name).toBe('Location B')
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

    expect(result.value?.locations).toHaveLength(1)
    expect(result.value?.locations[0].name).toBe('Active Building')
  })
})
