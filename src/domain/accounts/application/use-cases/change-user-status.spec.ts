import { makeSystemUser, makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { ChangeUserStatusUseCase } from './change-user-status'
import { UserRole } from '../../enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CannotModifyOwnAccountError } from '@/core/errors/cannot-modify-own-account-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ChangeUserStatusUseCase

describe('Change User Status', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ChangeUserStatusUseCase(inMemoryUsersRepository)
  })

  it('should be able to deactivate user as director', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
      isActive: true,
    })

    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      isActive: false,
      executorId: director.id.toValue(),
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(false)
    expect(inMemoryUsersRepository.items[1].isActive).toBe(false)
  })

  it('should be able to activate user as director', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
      isActive: true,
    })

    const user = makeUser({
      isActive: false,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      isActive: true,
      executorId: director.id.toValue(),
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(true)
    expect(inMemoryUsersRepository.items[1].isActive).toBe(true)
  })

  it('should be able to change user status as admin', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(admin)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      isActive: false,
      executorId: admin.id.toValue(),
      executorRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(false)
  })

  it('should allow admin to deactivate a director', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    const director = makeUser({
      role: UserRole.DIRECTOR,
      isActive: true,
    })

    inMemoryUsersRepository.items.push(admin)
    inMemoryUsersRepository.items.push(director)

    const result = await sut.execute({
      userId: director.id.toValue(),
      isActive: false,
      executorId: admin.id.toValue(),
      executorRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.isActive).toBe(false)
  })

  it('should not allow manager to change user status', async () => {
    const manager = makeUser({
      role: UserRole.MANAGER,
      isActive: true,
    })

    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(manager)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      isActive: false,
      executorId: manager.id.toValue(),
      executorRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow reporter to change user status', async () => {
    const reporter = makeUser({
      role: UserRole.REPORTER,
      isActive: true,
    })

    const user = makeUser({
      isActive: true,
    })

    inMemoryUsersRepository.items.push(reporter)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
      isActive: false,
      executorId: reporter.id.toValue(),
      executorRole: UserRole.REPORTER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow director to deactivate an admin', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
      isActive: true,
    })

    const admin = makeUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      userId: admin.id.toValue(),
      isActive: false,
      executorId: director.id.toValue(),
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[1].isActive).toBe(true)
  })

  it('should not allow director to deactivate another director', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
      isActive: true,
    })

    const anotherDirector = makeUser({
      role: UserRole.DIRECTOR,
      isActive: true,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(anotherDirector)

    const result = await sut.execute({
      userId: anotherDirector.id.toValue(),
      isActive: false,
      executorId: director.id.toValue(),
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[1].isActive).toBe(true)
  })

  it('should not be able to change status for non-existing user', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
    })

    inMemoryUsersRepository.items.push(director)

    const result = await sut.execute({
      userId: 'non-existing-id',
      isActive: false,
      executorId: director.id.toValue(),
      executorRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not allow changing the status of a system user', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    const systemUser = makeSystemUser()

    inMemoryUsersRepository.items.push(admin, systemUser)

    const result = await sut.execute({
      userId: systemUser.id.toValue(),
      isActive: true,
      executorId: admin.id.toValue(),
      executorRole: UserRole.ADMIN,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[1].isActive).toBe(false)
  })

  it('should not allow user to deactivate their own account', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      userId: admin.id.toValue(),
      isActive: false,
      executorId: admin.id.toValue(),
      executorRole: admin.role,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CannotModifyOwnAccountError)
    expect(inMemoryUsersRepository.items[0].isActive).toBe(true)
  })

  it('should allow user to activate their own account', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
      isActive: true,
    })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      userId: admin.id.toValue(),
      isActive: true,
      executorId: admin.id.toValue(),
      executorRole: admin.role,
    })

    expect(result.isRight()).toBe(true)
  })
})
