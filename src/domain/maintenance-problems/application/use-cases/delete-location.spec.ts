import { DeleteLocationUseCase } from './delete-location'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { makeLocation } from 'test/factories/make-location'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: DeleteLocationUseCase

describe('Delete Location', () => {
  beforeEach(() => {
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    sut = new DeleteLocationUseCase(inMemoryLocationsRepository)
  })

  it('should be able to delete a location permanently as manager', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryLocationsRepository.create(location)
    location.moveToTrash()

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items).toHaveLength(1)
    expect(inMemoryLocationsRepository.items[0].purgedAt).toBeInstanceOf(Date)
  })

  it('should be able to delete a location permanently as director', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryLocationsRepository.create(location)
    location.moveToTrash()

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items).toHaveLength(1)
    expect(inMemoryLocationsRepository.items[0].purgedAt).toBeInstanceOf(Date)
  })

  it('should be able to delete a location permanently as admin', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryLocationsRepository.create(location)
    location.moveToTrash()

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items).toHaveLength(1)
    expect(inMemoryLocationsRepository.items[0].purgedAt).toBeInstanceOf(Date)
  })

  it('should not be able to delete a location permanently as reporter', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryLocationsRepository.items).toHaveLength(1)
  })

  it('should not be able to delete a non-existing location', async () => {
    const result = await sut.execute({
      locationId: 'non-existing-id',
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not be able to permanently delete a location that is not in trash', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-1'))
    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })
})
