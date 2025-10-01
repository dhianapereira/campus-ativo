import { RestoreLocationUseCase } from './restore-location'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { makeLocation } from 'test/factories/make-location'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: RestoreLocationUseCase

describe('Restore Location', () => {
  beforeEach(() => {
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    sut = new RestoreLocationUseCase(inMemoryLocationsRepository)
  })

  it('should be able to restore a location from trash as manager', async () => {
    const location = makeLocation(
      {
        deletedAt: new Date(),
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0].deletedAt).toBeNull()
    expect(inMemoryLocationsRepository.items[0].isInTrash).toBe(false)
  })

  it('should be able to restore a location from trash as director', async () => {
    const location = makeLocation(
      {
        deletedAt: new Date(),
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0].deletedAt).toBeNull()
  })

  it('should be able to restore a location from trash as admin', async () => {
    const location = makeLocation(
      {
        deletedAt: new Date(),
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0].deletedAt).toBeNull()
  })

  it('should not be able to restore a location from trash as reporter', async () => {
    const location = makeLocation(
      {
        deletedAt: new Date(),
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to restore a non-existing location', async () => {
    const result = await sut.execute({
      locationId: 'non-existing-id',
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
