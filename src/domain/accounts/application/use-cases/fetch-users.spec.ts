import { InMemoryUsersRepository } from 'test/repositories/in-memory-users-repository'
import { FetchUsersUseCase } from './fetch-users'
import { makeUser } from 'test/factories/make-user-factory'
import { UserRole } from '../../enterprise/entities/user'

let inMemoryUsersRepository: InMemoryUsersRepository
let sut: FetchUsersUseCase

describe('Fetch Users', () => {
  beforeEach(() => {
    inMemoryUsersRepository = new InMemoryUsersRepository()
    sut = new FetchUsersUseCase(inMemoryUsersRepository)
  })

  it('should be able to fetch users', async () => {
    const user1 = makeUser({ name: 'Alice', role: UserRole.REPORTER })
    const user2 = makeUser({ name: 'Bob', role: UserRole.MANAGER })
    const user3 = makeUser({ name: 'Charlie', role: UserRole.DIRECTOR })

    inMemoryUsersRepository.items.push(user1, user2, user3)

    const result = await sut.execute({
      page: 1,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value).toEqual({
      users: expect.arrayContaining([
        expect.objectContaining({ name: 'Alice' }),
        expect.objectContaining({ name: 'Bob' }),
        expect.objectContaining({ name: 'Charlie' }),
      ]),
    })
  })

  it('should be able to fetch users with pagination', async () => {
    for (let i = 1; i <= 22; i++) {
      inMemoryUsersRepository.items.push(
        makeUser({ name: `User ${i}`, role: UserRole.REPORTER })
      )
    }

    const result = await sut.execute({
      page: 2,
    })

    expect(result.isRight()).toBe(true)
    expect(result.value?.users).toHaveLength(2)
  })
})