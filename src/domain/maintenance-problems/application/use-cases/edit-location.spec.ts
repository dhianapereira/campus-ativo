import { EditLocationUseCase } from './edit-location'
import { InMemoryLocationsRepository } from 'test/repositories/in-memory-locations-repository'
import { makeLocation } from 'test/factories/make-location'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { LocationInTrashError } from '@/core/errors/location-in-trash-error'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

let inMemoryLocationsRepository: InMemoryLocationsRepository
let sut: EditLocationUseCase

describe('Edit Location', () => {
  beforeEach(() => {
    inMemoryLocationsRepository = new InMemoryLocationsRepository()
    sut = new EditLocationUseCase(inMemoryLocationsRepository)
  })

  it('should be able to edit a location as manager', async () => {
    const location = makeLocation(
      {
        name: 'Original Name',
        code: 'X01',
        description: 'Original Description',
        isActive: true,
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      name: 'Updated Name',
      code: 'X02',
      description: 'Updated Description',
      isActive: false,
      userRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0]).toMatchObject({
      name: 'Updated Name',
      code: 'X02',
      description: 'Updated Description',
      isActive: false,
    })
  })

  it('should be able to edit a location as director', async () => {
    const location = makeLocation(
      {
        name: 'Original Name',
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      name: 'Updated Name',
      isActive: true,
      userRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0].name).toBe('Updated Name')
  })

  it('should be able to edit a location as admin', async () => {
    const location = makeLocation(
      {
        name: 'Original Name',
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      name: 'Updated Name',
      isActive: true,
      userRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0].name).toBe('Updated Name')
  })

  it('should not be able to edit a location as reporter', async () => {
    const location = makeLocation({}, new UniqueEntityID('location-1'))

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      name: 'Updated Name',
      isActive: true,
      userRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to edit a non-existing location', async () => {
    const result = await sut.execute({
      locationId: 'non-existing-id',
      name: 'Updated Name',
      isActive: true,
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should be able to clear location description', async () => {
    const location = makeLocation(
      {
        name: 'Original Name',
        code: 'X01',
        description: 'Original Description',
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      name: 'Original Name',
      code: 'X01',
      description: '',
      userRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(inMemoryLocationsRepository.items[0].description).toBe('')
  })

  it('should not be able to edit a location in trash', async () => {
    const location = makeLocation(
      {
        deletedAt: new Date(),
      },
      new UniqueEntityID('location-1'),
    )

    await inMemoryLocationsRepository.create(location)

    const result = await sut.execute({
      locationId: 'location-1',
      name: 'Updated Name',
      isActive: true,
      userRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(LocationInTrashError)
  })
})
