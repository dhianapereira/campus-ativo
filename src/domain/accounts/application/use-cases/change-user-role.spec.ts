import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user'
import { ChangeUserRoleUseCase } from './change-user-role'
import { UserRole } from '../../enterprise/entities/user'
import { UnauthorizedRoleChangeError } from './errors/unauthorized-role-change-error'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: ChangeUserRoleUseCase

describe('Change User Role', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new ChangeUserRoleUseCase(inMemoryUsersRepository)
  })

  it('should allow admin to change any user role', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    const reporter = makeUser({ role: UserRole.REPORTER })

    await inMemoryUsersRepository.create(admin)
    await inMemoryUsersRepository.create(reporter)

    const result = await sut.execute({
      currentUserId: admin.id.toString(),
      targetUserId: reporter.id.toString(),
      newRole: UserRole.MANAGER,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      user: expect.objectContaining({
        role: UserRole.MANAGER,
      }),
    })
  })

  it('should allow director to change roles below their level', async () => {
    const director = makeUser({ role: UserRole.DIRECTOR })
    const manager = makeUser({ role: UserRole.MANAGER })

    await inMemoryUsersRepository.create(director)
    await inMemoryUsersRepository.create(manager)

    const result = await sut.execute({
      currentUserId: director.id.toString(),
      targetUserId: manager.id.toString(),
      newRole: UserRole.REPORTER,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      user: expect.objectContaining({
        role: UserRole.REPORTER,
      }),
    })
  })

  it('should not allow director to change admin or director roles', async () => {
    const director = makeUser({ role: UserRole.DIRECTOR })
    const admin = makeUser({ role: UserRole.ADMIN })

    await inMemoryUsersRepository.create(director)
    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      currentUserId: director.id.toString(),
      targetUserId: admin.id.toString(),
      newRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnauthorizedRoleChangeError)
  })

  it('should not allow manager or reporter to change any roles', async () => {
    const manager = makeUser({ role: UserRole.MANAGER })
    const reporter = makeUser({ role: UserRole.REPORTER })

    await inMemoryUsersRepository.create(manager)
    await inMemoryUsersRepository.create(reporter)

    const result = await sut.execute({
      currentUserId: manager.id.toString(),
      targetUserId: reporter.id.toString(),
      newRole: UserRole.DIRECTOR,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(UnauthorizedRoleChangeError)
  })

  it('should return error if current user does not exist', async () => {
    const reporter = makeUser({ role: UserRole.REPORTER })
    await inMemoryUsersRepository.create(reporter)

    const result = await sut.execute({
      currentUserId: 'non-existent-id',
      targetUserId: reporter.id.toString(),
      newRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })

  it('should return error if target user does not exist', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await inMemoryUsersRepository.create(admin)

    const result = await sut.execute({
      currentUserId: admin.id.toString(),
      targetUserId: 'non-existent-id',
      newRole: UserRole.MANAGER,
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})
