import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { ChangeUserRoleUseCase } from './change-user-role'
import { UserRole } from '../../enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ChangeUserRoleUseCase

describe('Change User Role', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ChangeUserRoleUseCase(inMemoryUsersRepository)
  })

  it('should be able to change user role as admin', async () => {
    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toString(),
      newRole: UserRole.MANAGER,
      currentUserRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.role).toBe(UserRole.MANAGER)
  })

  it('should be able to change lower role as director', async () => {
    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toString(),
      newRole: UserRole.MANAGER,
      currentUserRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.role).toBe(UserRole.MANAGER)
  })

  it('should not allow director to change admin role', async () => {
    const adminUser = makeUser({
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(adminUser)

    const result = await sut.execute({
      targetUserId: adminUser.id.toString(),
      newRole: UserRole.MANAGER,
      currentUserRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow director to assign admin role', async () => {
    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toString(),
      newRole: UserRole.ADMIN,
      currentUserRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow manager to change roles', async () => {
    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toString(),
      newRole: UserRole.MANAGER,
      currentUserRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to change role for non-existing user', async () => {
    const result = await sut.execute({
      targetUserId: 'non-existing-id',
      newRole: UserRole.MANAGER,
      currentUserRole: UserRole.ADMIN,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})