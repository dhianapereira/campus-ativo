import { makeSystemUser, makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { ChangeUserRoleUseCase } from './change-user-role'
import { UserRole } from '../../enterprise/entities/user'
import { NotAllowedError } from '@/core/errors/not-allowed-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'
import { CannotModifyOwnAccountError } from '@/core/errors/cannot-modify-own-account-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ChangeUserRoleUseCase

describe('Change User Role', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ChangeUserRoleUseCase(inMemoryUsersRepository)
  })

  it('should be able to change user role as admin', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
    })

    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(admin)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toValue(),
      newRole: UserRole.MANAGER,
      currentUserId: admin.id.toValue(),
      currentUserRole: UserRole.ADMIN,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.role).toBe(UserRole.MANAGER)
  })

  it('should be able to change lower role as director', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
    })

    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toValue(),
      newRole: UserRole.MANAGER,
      currentUserId: director.id.toValue(),
      currentUserRole: UserRole.DIRECTOR,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.user.role).toBe(UserRole.MANAGER)
  })

  it('should not allow director to change admin role', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
    })

    const adminUser = makeUser({
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(adminUser)

    const result = await sut.execute({
      targetUserId: adminUser.id.toValue(),
      newRole: UserRole.MANAGER,
      currentUserId: director.id.toValue(),
      currentUserRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow director to assign admin role', async () => {
    const director = makeUser({
      role: UserRole.DIRECTOR,
    })

    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(director)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toValue(),
      newRole: UserRole.ADMIN,
      currentUserId: director.id.toValue(),
      currentUserRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not allow manager to change roles', async () => {
    const manager = makeUser({
      role: UserRole.MANAGER,
    })

    const user = makeUser({
      role: UserRole.REPORTER,
    })

    inMemoryUsersRepository.items.push(manager)
    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      targetUserId: user.id.toValue(),
      newRole: UserRole.MANAGER,
      currentUserId: manager.id.toValue(),
      currentUserRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
  })

  it('should not be able to change role for non-existing user', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      targetUserId: 'non-existing-id',
      newRole: UserRole.MANAGER,
      currentUserId: admin.id.toValue(),
      currentUserRole: UserRole.ADMIN,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not allow user to change their own role', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
    })

    inMemoryUsersRepository.items.push(admin)

    const result = await sut.execute({
      targetUserId: admin.id.toValue(),
      newRole: UserRole.REPORTER,
      currentUserId: admin.id.toValue(),
      currentUserRole: UserRole.ADMIN,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(CannotModifyOwnAccountError)
    expect(inMemoryUsersRepository.items[0].role).toBe(UserRole.ADMIN)
  })

  it('should not allow changing the role of a system user', async () => {
    const admin = makeUser({
      role: UserRole.ADMIN,
    })

    const systemUser = makeSystemUser()

    inMemoryUsersRepository.items.push(admin, systemUser)

    const result = await sut.execute({
      targetUserId: systemUser.id.toValue(),
      newRole: UserRole.ADMIN,
      currentUserId: admin.id.toValue(),
      currentUserRole: UserRole.ADMIN,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(NotAllowedError)
    expect(inMemoryUsersRepository.items[1].role).toBe(UserRole.SYSTEM)
  })
})
