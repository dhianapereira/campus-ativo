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
})
