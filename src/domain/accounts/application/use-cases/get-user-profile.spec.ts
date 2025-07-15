import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { GetUserProfileUseCase } from './get-user-profile'
import { makeUser } from 'test/factories/make-user-factory'
import { UserRole } from '../../enterprise/entities/user'
import { ResourceNotFoundError } from '@/core/errors/resource-not-found-error'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: GetUserProfileUseCase

describe('Get User Profile', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new GetUserProfileUseCase(inMemoryUsersRepository)
  })

  it('should be able to get a user profile', async () => {
    const user = makeUser({ 
      name: 'John Doe', 
      email: 'john@example.com',
      role: UserRole.REPORTER 
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toString(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      user: expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com',
        role: UserRole.REPORTER,
      }),
    })
  })

  it('should not be able to get a user profile that does not exist', async () => {
    const result = await sut.execute({
      userId: 'non-existent-user',
    })

    expect(result.isLeft()).toBe(true)
    expect(result.value).toBeInstanceOf(ResourceNotFoundError)
  })
})