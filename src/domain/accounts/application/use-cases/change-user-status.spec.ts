import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { ChangeUserStatusUseCase } from './change-user-status'
import { UserRole } from '../../enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ChangeUserStatusUseCase

describe('Change User Status', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ChangeUserStatusUseCase(inMemoryUsersRepository)
  })

  it('should be able to deactivate user as director', async () => {
    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      isActive: false,
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(false)
    expect(inMemoryUsersRepository.items[0].isActive).toBe(false)
  })

  it('should be able to activate user as director', async () => {
    const user = makeUser({
      isActive: false,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      isActive: true,
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(true)
    expect(inMemoryUsersRepository.items[0].isActive).toBe(true)
  })

  it('should be able to change user status as admin', async () => {
    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      isActive: false,
      executorRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(false)
  })

  it('should not allow manager to change user status', async () => {
    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      isActive: false,
      executorRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow reporter to change user status', async () => {
    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      isActive: false,
      executorRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to change status for non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-id',
      isActive: false,
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
