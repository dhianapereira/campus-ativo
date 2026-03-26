import { UnauthorizedException } from '@nestjs/common'
import { JwtStrategy } from './jwt.strategy'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { makeUser } from 'test/factories/make-user'
import { UserRole } from '@/domain/accounts/enterprise/entities/user'

describe('JwtStrategy', () => {
  let inMemoryUsersRepository: InMemoryUsersRepository
  let sut: JwtStrategy

  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new JwtStrategy(
      {
        get: () => Buffer.from('test-public-key').toString('base64'),
      } as never,
      inMemoryUsersRepository,
    )
  })

  it('should return the current role from the database', async () => {
    const user = makeUser({
      role: UserRole.REPORTER,
      isActive: true,
    })

    await inMemoryUsersRepository.create(user)

    user.changeRole(UserRole.ADMIN)
    await inMemoryUsersRepository.save(user)

    const result = await sut.validate({
      sub: user.id.toValue(),
      role: UserRole.REPORTER,
    })

    expect(result).toEqual({
      sub: user.id.toValue(),
      role: UserRole.ADMIN,
    })
  })

  it('should reject inactive users even with a valid token payload', async () => {
    const user = makeUser({
      role: UserRole.MANAGER,
      isActive: false,
    })

    await inMemoryUsersRepository.create(user)

    await expect(
      sut.validate({
        sub: user.id.toValue(),
        role: UserRole.MANAGER,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
