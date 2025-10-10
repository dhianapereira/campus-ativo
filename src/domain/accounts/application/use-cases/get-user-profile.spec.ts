import { makeUser } from 'test/factories/make-user'
import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { GetUserProfileUseCase } from './get-user-profile'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: GetUserProfileUseCase

describe('Get User Profile', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new GetUserProfileUseCase(inMemoryUsersRepository)
  })

  it('should be able to get user profile', async () => {
    const user = makeUser({
      name: 'John Doe',
      position: 'Reporter',
    })

    inMemoryUsersRepository.items.push(user)

    const result = await sut.execute({
      userId: user.id.toValue(),
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toMatchObject({
      user: expect.objectContaining({
        name: 'John Doe',
        position: 'Reporter',
      }),
    })
  })

  it('should not be able to get profile for non-existing user', async () => {
    const result = await sut.execute({
      userId: 'non-existing-id',
    })

    expect(result.isLeft()).toBe(true)
  })
})